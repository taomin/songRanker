(function(){
    YUI().use('jsonp', 'panel', 'handlebars', 'io-base', 'json', function(Y){

        var SEARCH_SONG = 1,
            ADD_SONG = 2,
            LOGIN_YAHOO = 3;

        songRanker = {
            partials: {},
            panel: null,
            onPanelOK: null,
            songlist: null,

            init: function(){
                var self = this;
                this.partials.songs = Y.Handlebars.compile(decodeURIComponent(Partials.songs));
                this.partials.newsong = Y.Handlebars.compile(decodeURIComponent(Partials.newsong));
                this.panel = new Y.Panel({
                    headerContent: 'Add A New Song',
                    bodyContent: '',
                    srcNode : '.new-songs',
                    width   : 600,
                    centered: true,
                    visible : false,
                    render  : true,
                    modal  : true,
                    buttons: [
                        {
                            value  : 'Cancel',
                            section: Y.WidgetStdMod.FOOTER,
                            action : function (e) {
                                e.preventDefault();
                                this.hide();
                            }
                        },
                        {
                            value  : 'OK',
                            section: Y.WidgetStdMod.FOOTER,
                            action : function(e) {
                                e.preventDefault();

                                if (self.onPanelOK) {
                                    self.onPanelOK(e);
                                }
                            }
                        }
                    ]
                });

                this.songlist = Y.one('.songlist');
                this.songlist.delegate('click', this.voteSong, '.like,.dislike', this);
                Y.one('.new-songs').delegate('click', this.selectNewSong, 'input.song-picker', this);
                Y.one('.add-song').on('click', this.inputSong, this);
            },

            handleSpotifySearch: function (e) {
                var input = Y.one('.song-query').get('value');
                this.querySpotify(input);
            },

            handleNewSongSelect: function (e) {
                this.addSong();
                this.panel.hide();
            },

            inputSong: function () {
                var self = this;
                if (typeof(User) === 'undefined') {
                    // user is not logged in yet.
                    this.onPanelOK = this.loginYahoo;
                    this.panel.setStdModContent(Y.WidgetStdMod.BODY, 'You have to login to Yahoo to vote! Click OK to login', Y.WidgetStdMod.REPLACE);
                    this.panel.show();
                    return;
                }

                node = Y.one('.new-songs');
                self.panel.setStdModContent(Y.WidgetStdMod.BODY, self.partials.newsong({}), Y.WidgetStdMod.REPLACE);
                node.setStyle('display','block');
                self.panelState = SEARCH_SONG;
                self.onPanelOK = self.handleSpotifySearch;
                self.panel.show();
            },

            selectNewSong: function (e) {
                var target = e.target;

                this.currentSong = {
                    'name': target.getData('track'),
                    'artist': target.getData('artist'),
                    'album': target.getData('album'),
                    'spotify_link': target.getData('href'),
                    'vote': 0
                };
            },

            querySpotify: function(query) {
                var self = this,
                    url = 'http://query.yahooapis.com/v1/public/yql?q={q}&format=json&callback={callback}',
                    params = {
                        q: encodeURIComponent('use "store://5gdpUCp8oq5Bw8xTwjSTqr" as spotify; SELECT tracks FROM spotify(30) WHERE' +
                           ' query="' + encodeURIComponent(query) + '" and tracks.album.availability LIKE "%US%"')
                    };

                try {
                    Y.jsonp(Y.Lang.sub(url, params), function(resp) {
                        var result = Y.Object.getValue(resp, ['query', 'results', 'json']),
                            panel,
                            node;

                        self.panel.hide();
                        self.panelState = ADD_SONG;
                        self.onPanelOK = self.handleNewSongSelect;
                        self.panel.setStdModContent(Y.WidgetStdMod.BODY, self.partials.newsong({data: result}), Y.WidgetStdMod.REPLACE);
                        self.panel.show();

                    });
                }catch(ex){
                    console.log('yql call errors');
                }
            },

            addSong: function(){

                // TODO: check for duplication

                var self = this,
                    html = this.partials.songs({
                        songs: [this.currentSong]
                    }),
                    cfg;

                // sync to backend
                cfg = {
                    method: 'POST',
                    data: {'song': Y.JSON.stringify(this.currentSong)},
                    on: {
                        complete: function(){
                            self.songlist.append(html);
                            self.panel.hide();
                            self.voteSong({target: self.songlist.get('lastChild').one('.like')});
                        }
                    }
                };

                Y.io('add_song', cfg);
            },

            voteSong: function(e) {
                var target = e.target,
                    vote = target.hasClass('like') ? 1 : 0,
                    songNode, cfg;

                if (typeof(User) === 'undefined') {
                    // user is not logged in yet.
                    this.onPanelOK = this.loginYahoo;
                    this.panel.setStdModContent(Y.WidgetStdMod.BODY, 'You have to login to Yahoo to vote! Click OK to login', Y.WidgetStdMod.REPLACE);
                    this.panel.show();
                    return;
                }

                if (vote !== 0) {
                    songNode = target.ancestor('li');
                    cfg = {
                        method: 'POST',
                        data: {'spotify_link': songNode.getData('href'), 'vote': vote, 'email': User.email},
                        on: {
                            complete: function(){
                                //update the votes shown on FE
                                var voteCntNode = songNode.one('.vote-cnt'),
                                    voteCnt = voteCntNode.get('text');
                                try {
                                    voteCnt = parseInt(voteCnt) + vote;
                                }catch(ex){
                                    voteCnt = vote;
                                }
                                voteCntNode.set('innerHTML', voteCnt);
                                target.setAttribute('disabled', 'disabled');
                            }
                        }
                    };
                }

                Y.io('vote_song', cfg);
            },

            loginYahoo: function() {
                window.location.href += 'auth/yahoo';
            }

        };

        songRanker.init();

    });
})();