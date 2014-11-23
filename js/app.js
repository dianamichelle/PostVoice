function GoogleSearch() {}
GoogleSearch.prototype.lastSearch = null;
GoogleSearch.prototype.search = function(term, searchEngine) {
    if (this.lastSearch == null || this.lastSearch != term) {
        window.open('http://google.com/cse?sa=Search&ie=UTF-8&q='+ term +'&cx='+ searchEngine, '_blank');
        this.lastSearch = term;
    }
};


function TwitterSearch() {
    this.key = 'knfQM3jr7FSQllmxuKIsitZVt';
    this.keysecret = 'FBkcbl1rL1Xmo4IfNUosFPIKWFxbd9auxQHwi9LvFPmycGAOxY';
    var authenticated = false;

    var cb = new Codebird;
    cb.setConsumerKey(this.key, this.keysecret);

    this.isAuthenticated = function () {
        return authenticated;
    };

    this.authorize = function() {
        cb.__call(
            "oauth_requestToken",
            {oauth_callback: "oob"},
            function (reply) {
                // stores it
                cb.setToken(reply.oauth_token, reply.oauth_token_secret);

                // gets the authorize screen URL
                cb.__call(
                    "oauth_authorize",
                    {},
                    function (auth_url) {
                        window.codebird_auth = window.open(auth_url);
                    }
                );
            }
        );
    };

    this.setPIN = function(PIN) {
        cb.__call(
            "oauth_accessToken",
            {oauth_verifier: PIN},
            function (reply) {
                // store the authenticated token, which may be different from the request token (!)
                cb.setToken(reply.oauth_token, reply.oauth_token_secret);
                authenticated = true;
            }
        );
    };

    this.postStatus = function(term, success) {
        cb.__call(
            'statuses_update',
            {'status': term},
            function (reply) {
                if (reply.httpstatus == 200) {
                    success(reply);
                }
            }
        );
    };
}


$(document).ready(function () {
    var recognition = new webkitSpeechRecognition();
    var google = new GoogleSearch();
    var twitter = new TwitterSearch();

    $('#recorder').click(function () {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = function (event) {
            var results = event.results;
            var size = results.length;
            var txtArea = document.getElementById('txt-area');
            var stopRecordingSpoken = false;
            txtArea.innerHTML = "";
            for (var i = 0; i < size; i++) {
                switch (results[i][0].transcript.trim()) {
                    case 'vírgula':
                        txtArea.innerHTML += ", ";
                        break;
                    case 'ponto final':
                        txtArea.innerHTML += ".\n";
                        break;
                    case 'ponto de interrogação':
                        txtArea.innerHTML += "?\n";
                        break;
                    case 'ponto de exclamação':
                        txtArea.innerHTML += "!\n";
                        break;
                    case 'parar gravação':
                        stopRecordingSpoken = true;
                        break;
                    case 'arroba':
                        txtArea.innerHTML += "@";
                        break;
                    case 'hashtag':
                        txtArea.innerHTML += "#";
                        break;
                    case 'limpar texto':
                        txtArea.innerHTML = "";
                        break;
                    case 'pesquisar no google':
                        google.search(txtArea.innerHTML, 'google.search.WebSearch');
                        stopRecordingSpoken = true;
                        break;
                    case 'postar no twitter':
                        if (twitter.isAuthenticated()) {
                            twitter.postStatus(txtArea.innerHTML, function(reply) {
                                var tweetModal = $('#tweet-modal');
                                var text = reply.text;
                                if (text.length > 100) {
                                    text = text.substr(0, 97);
                                    text += "...";
                                }
                                tweetModal.find('#tweet-message').html(text);
                                tweetModal.find('#tweet-user').html(reply.user.name + "(@" + reply.user.screen_name + ")");
                                tweetModal.find('#tweet-link').remove();
                                tweetModal.find('#tweet-blockquote').append(
                                    $('<a class="tweet-link" href="https://twitter.com/'+ reply.user.screen_name +'/status/'+ reply.id_str +'">').text('Ver no twitter')
                                );
                                tweetModal.trigger('openModal');
                                console.log(reply);
                            });
                        }
                        break;
                    default:
                        txtArea.innerHTML += results[i][0].transcript;
                        break;
                }
            }
            if (stopRecordingSpoken) {
                stopRecording();
            }
        };
        recognition.start();
        $(this).hide();
        $('#stopper').show();
    });

    function stopRecording() {
        recognition.stop();
        $("#stopper").hide();
        $('#recorder').show();
    }

    $('#stopper').click(function () {
        stopRecording();
    });

    $('#clear').click(function () {
        $('#txt-area').val('');
    });

    $('#PIN-wrapper, #twitter-authorized-msg').hide();

    $('#twitter').click(function(){
        twitter.authorize();
        $('#PIN-wrapper').fadeIn('fast');
    });

    $('#PIN-submit').click(function () {
        $('#PIN-wrapper, #twitter').fadeOut('fast');
        twitter.setPIN($('#PIN').val().trim());
        $('#twitter-authorized-msg').fadeIn();
    });

    $('#tweet-modal').easyModal();
    $('#modal-close').click(function () {
        $('#tweet-modal').trigger('closeModal');
    });
});