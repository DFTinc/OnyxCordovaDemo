/*****************************************************************************/
/*  Server Methods */
/*****************************************************************************/

Meteor.methods({
    'isEmailRegistered': function (email) {
        var user;
        if (email) {
            user = Accounts.findUserByEmail(email);
        }
        if (user) {
            return true;
        }
        return false;
    },
    'onyx/fingerprint/save': function (data) {
        data.userId = this.userId;
        return Fingerprints.upsert({userId: data.userId}, data);
    },
    'onyx/fingerprint/verify': function (data) {
        var user = {};
        user._id = this.userId;
        if (!user._id) {
            // user is not logged in, so this is a login request.
            user = Accounts.findUserByEmail(data.signInWithOnyx);
        }
        var OnyxApi = Meteor.npmRequire('onyx-node');
        var fingerprint = Fingerprints.findOne({userId: user._id});
        if (!fingerprint) {
            throw new Meteor.Error("not-enrolled", "No fingerprint enrolled.");
        }
        var dbTpl = new OnyxApi.FingerprintTemplate(new Buffer(fingerprint.template, 'base64'), 100);
        var reqTpl = new OnyxApi.FingerprintTemplate(new Buffer(data.template, 'base64'), 100);
        var ftv = new OnyxApi.FingerprintTemplateVector();
        ftv.push_back(dbTpl);
        // Do verification
        var result = OnyxApi.identify(ftv, reqTpl);
        console.log("result: ", result);
        var verified = false;
        if (result.score >= 34) {
            console.log('Template Verified');
            verified = true;
        }

        var token;
        if (data.signInWithOnyx) {
            var stampedLoginToken = Accounts._generateStampedLoginToken();
            Accounts._insertLoginToken(user._id, stampedLoginToken);
            token = stampedLoginToken.token;
        }
        return {isVerified: verified, score: result.score, token: token};
    }
});
