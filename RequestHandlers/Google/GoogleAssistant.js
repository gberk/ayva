var SSMLBuilder = require('../SSMLBuilder')

var GoogleAssistant = function(_res){
    var res = _res;

    var repeatForRepromptFlag = false;
    this.speechBuilder = new SSMLBuilder();
    this.repromptBuilder = new SSMLBuilder();

    var responseData = {
        speech: "",
        displayText: "",
        data: {"google":{"is_ssml":true,"no_input_prompts":[], "expect_user_response": true}},
        contextOut: [],
        source: "",
        followupEvent: {}
    };

    var resStatus = 200;

    /* /////////////////////////////////
    // Speech Builder Functions
    */ ///////////////////////////////
    this.say = this.speechBuilder.say.bind(this);
    this.play = this.speechBuilder.play.bind(this);
    this.pause = this.speechBuilder.pause.bind(this);

    this.reprompt = {
        say: this.repromptBuilder.say.bind(this),
        play: this.repromptBuilder.play.bind(this),
        pause: this.repromptBuilder.pause.bind(this)
    }

    this.repeatForReprompt = function(){
        repeatForRepromptFlag = true;
        this.reprompt = null;
        return this;
    }

    this.setContext = function(contextName, lifespan) {
        let context = {
            name: contextName,
            lifespan: lifespan
        }
        responseData.contextOut.push(context)
        return this;
    }

    this.data = function(_data){
        responseData.data = _data;
        return this;
    }

    this.card = function(cardJSON){
        responseData.data.google.richResponse = {"items":[]}            
        responseData.data.google.richResponse.items.push(cardJSON)
        return this;
    }

    this.error = function(errorCode){
        resStatus = errorCode;
        return this;
    }

    //FORMER TEST FUNCTION
    this.location = function(script){
        this.say("PLACEHOLDER_FOR_SOME_REASON");
        responseData.data.google.systemIntent = 
        {
            intent: "actions.intent.PERMISSION",
            data: {
                 "@type": "type.googleapis.com/google.actions.v2.PermissionValueSpec",
                "opt_context": script,
                "permissions": ["DEVICE_PRECISE_LOCATION"]
            }
        }
        return this;
    }

    // Notification permissions
    this.notification = function(intent_name){
        this.say("PLACEHOLDER_FOR_SOME_REASON");
        responseData.data.google.systemIntent = 
        {
            intent: "actions.intent.PERMISSION",
            data: {
                    "@type": "type.googleapis.com/google.actions.v2.PermissionValueSpec",
                "opt_context": undefined,
                "permissions": ["UPDATE"],
                "updatePermissionValueSpec": {
                        arguments: undefined,
                    "intent": intent_name
                }
            }
        }
        return this;
    }

    this.finish = function(opts){
        if(opts){
            if (opts.exit)
                responseData.data.google.expect_user_response = false; // close the microphone
        }
        responseData.speech = this.speechBuilder.getSSML();

        var reprompt = repeatForRepromptFlag ? responseData.speech : this.repromptBuilder.getSSML();
        responseData.data.google.no_input_prompts.push({
            ssml: reprompt
        })

        //Hack to get cards working. We need to reconsider how to do rich responses as a whole
        if(responseData.data.google.richResponse && responseData.data.google.richResponse.items.length)
        {
            responseData.data.google.richResponse.items.unshift({
                "simpleResponse": {
                  "ssml": responseData.speech
                }
              })
        }
        res.status(resStatus).send(responseData);
    }

}


module.exports = GoogleAssistant;