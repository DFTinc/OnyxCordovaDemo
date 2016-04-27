/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
    'click #onyxCapture': function () {
        execOnyx({action: Onyx.Action.IMAGE});
    },
    'click #onyxEnroll': function () {
        execOnyx({action: Onyx.Action.ENROLL});
    },
    'click #onyxVerify': function () {
        execOnyx({action: Onyx.Action.VERIFY});
    },
    'click #onyxTemplate': function () {
        // Don't trigger login
        Session.clear("signInWithOnyx");
        execOnyx({action: Onyx.Action.TEMPLATE});
    },
    'submit #signInWithOnyxForm': function (event, template) {
        event.preventDefault();
        $("#signInWithOnyxForm").validator('validate');
        Meteor.defer(function () {
            var formIsValid = !$("#signInWithOnyx").hasClass('disabled');
            if (formIsValid) {
                Meteor.call('isEmailRegistered', template.find("#email").value.toLowerCase(), function (error, result) {
                    if (error) {
                        swal({
                            type: "error",
                            title: "Sign In Error",
                            text: error.message
                        })
                    } else if (!result) {
                        Session.set("isEmailRegistered", false);
                        $("#signInWithOnyxForm").validator('validate');
                    } else {
                        execOnyx({action: Onyx.Action.TEMPLATE});
                        Session.set("signInWithOnyx", template.find("#email").value.toLowerCase());
                    }
                });
            }
        });
    }
});

function execOnyx(options) {
    if (Meteor.isCordova) {
        options.onyxLicense = Meteor.settings.public.onyxLicense;
        navigator.onyx.exec(options, successCallback, errorCallback);
    } else {
        console.log("This feature is only available on cordova devices.");
        swal({
            type: "error",
            title: "Cordova Only!",
            text: "This feature is only available on cordova devices."
        })
    }
}

function successCallback(result) {
    console.log("successCallback(): " + JSON.stringify(result));
    console.log("action: ", result.action);
    switch (result.action) {
        case Onyx.Action.IMAGE:
            if (result.hasOwnProperty("imageUri")) {
                Session.set("imageUri", result.imageUri);
            }
            break;
        case Onyx.Action.VERIFY:
            if (result.hasOwnProperty("nfiqScore")) {
                console.log("isVerified", result.isVerified);
                console.log("nfiqScore: " + result.nfiqScore);
                var type = (result.isVerified ? "success" : "error");
                var title = (result.isVerified ? "Verified" : "Failed");
                swal({
                    type: type,
                    title: title,
                    text: "Match score: " + result.nfiqScore
                });
            }
            break;
        case Onyx.Action.ENROLL:
            if (result.hasOwnProperty("template")) {
                Meteor.call('onyx/fingerprint/save', {template: result.template}, function (error, result) {
                    if (error) {
                        console.log("Error saving fingerprint template: ", error);
                    } else {
                        console.log("Successfully saved fingerprint template.");
                        swal({
                            type: "success",
                            title: "Fingerprint Template Saved"
                        });
                    }
                });
            }
            break;
        case Onyx.Action.TEMPLATE:
            if (result.hasOwnProperty("template")) {
                Meteor.call('onyx/fingerprint/verify', {
                    template: result.template,
                    signInWithOnyx: Session.get("signInWithOnyx")
                }, function (error, result) {
                    var swalConfig = {};
                    if (error) {
                        console.log("Error verifying fingerprint template: ", error);
                        var msg;
                        if (error.reason) {
                            msg = error.reason;
                        } else if (error.message) {
                            msg = error.message;
                        } else {
                            msg = error;
                        }
                        swalConfig.type = "error";
                        swalConfig.title = "Verify Error";
                        swalConfig.text = msg;
                    } else {
                        if (result.isVerified) {
                            swalConfig.type = "success";
                            swalConfig.title = "Verified";
                            swalConfig.text = "Your fingerprint matched!";
                            if (result.token) {
                                Meteor.loginWithToken(result.token);
                            }
                        } else {
                            swalConfig.type = "error";
                            swalConfig.title = "Failed";
                            swalConfig.text = "Your fingerprint did not match!"
                        }
                        swalConfig.text += "\nMatch Score: " + result.score;
                    }
                    swal(swalConfig);
                });
            }
            break;
    }
}

function errorCallback(message) {
    console.log("errorCallback(): " + message);
    swal({
        type: "error",
        title: "Onyx Error",
        text: message
    })
}
/*****************************************************************************/
/* Home: Helpers */
/*****************************************************************************/
Template.Home.helpers({
    imageUri: function () {
        return Session.get("imageUri");
    }
});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.Home.onCreated(function () {
    Session.clear("imageUri");
    Session.clear("signInWithOnyx");
    Tracker.autorun(function () {
        console.log("Meteor.status: " + Meteor.status().status);
    });
});

Template.Home.onRendered(function () {
    Session.set("isEmailRegistered", true);
    $('#signInWithOnyxForm').validator({
        custom: {
            unique: function (element) {
                var email = $(element).val().toLowerCase();
                if (email) {
                    Meteor.call('isEmailRegistered', email, function (error, result) {
                        if (error) {
                            console.log("isEmailRegistered Error: " + error.message);
                        } else {
                            Session.set("isEmailRegistered", result);
                        }
                    });
                } else {
                    Session.set("isEmailRegistered", false);
                }
                return !Session.get("isEmailRegistered");
            },
            registered: function (element) {
                var valid = true;
                if (!Session.get("isEmailRegistered")) {
                    Session.set("isEmailRegistered", true);
                    valid = false;
                }
                return valid;
            },
            validatepassword: function (element) {
                var valid = true;
                if (!Session.get("correctPassword")) {
                    Session.set("correctPassword", true);
                    valid = false;
                }
                return valid;
            }
        },
        errors: {
            unique: "Email address already registered",
            registered: "Email address not registered",
            validatepassword: "Incorrect Password"
        },
        feedback: {
            success: 'glyphicon-ok',
            error: 'glyphicon-exclamation-sign'
        }
    });
});

Template.Home.onDestroyed(function () {
});
