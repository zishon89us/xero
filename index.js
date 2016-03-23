
var crypto  = require("crypto"),
    oauth   = require("oauth"),
    EasyXml = require('easyxml'),
    xml2js = require('xml2js'),
    inflect = require('inflect');

var XERO_BASE_URL = 'https://api.xero.com',
    XERO_CORE_API_URL = XERO_BASE_URL + '/api.xro/2.0',
    XERO_PAYROLL_API_URL = XERO_BASE_URL + '/payroll.xro/1.0';

function Xero(key, secret, rsa_key, showXmlAttributes, customHeaders) {

    this.key = key;
    this.secret = secret;

    this.parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: showXmlAttributes !== undefined ? (showXmlAttributes ? false : true) : true, async: true});

    this.oa = new oauth.OAuth(null, null, key, secret, '1.0', null, "PLAINTEXT", null, customHeaders);
    this.oa._signatureMethod = "RSA-SHA1"
    this.oa._createSignature = function(signatureBase, tokenSecret) {
        return crypto.createSign("RSA-SHA1").update(signatureBase).sign(rsa_key, output_format = "base64");
    };
}

Xero.prototype.core = function(method, path, body, callback) {
    var self = this;

    var post_body = null;
    var content_type = null;
    if (method && method !== 'GET' && body) {
        if (Buffer.isBuffer(body)) {
            post_body = body;
        } else {
            var root = path.match(/([^\/\?]+)/)[1];
            post_body = new EasyXml({rootElement: inflect.singularize(root), rootArray: root, manifest: true}).render(body);
            content_type = 'application/xml';
        }
    }
    var process = function(err, xml, res) {
        if (err) {
            return callback(err);
        }

        self.parser.parseString(xml, function(err, json) {
            if (err) return callback(err);
            if (json && json.Response && json.Response.Status !== 'OK') {
                return callback(json, res);
            } else {
                return callback(null, json, res);
            }
        });
    };
    return self.oa._performSecureRequest(self.key, self.secret, method, XERO_CORE_API_URL + path, null, post_body, content_type, callback ? process : null);
}

Xero.prototype.payroll = function(method, path, body, callback) {
    var self = this;

    var post_body = null;
    var content_type = null;
    if (method && method !== 'GET' && body) {
        if (Buffer.isBuffer(body)) {
            post_body = body;
        } else {
            var root = path.match(/([^\/\?]+)/)[1];
            post_body = new EasyXml({rootElement: inflect.singularize(root), rootArray: root, manifest: true}).render(body);
            content_type = 'application/xml';
        }
    }
    var process = function(err, xml, res) {
        if (err) {
            return callback(err);
        }

        self.parser.parseString(xml, function(err, json) {
            if (err) return callback(err);
            if (json && json.Response && json.Response.Status !== 'OK') {
                return callback(json, res);
            } else {
                return callback(null, json, res);
            }
        });
    };
    return self.oa._performSecureRequest(self.key, self.secret, method, XERO_PAYROLL_API_URL + path, null, post_body, content_type, callback ? process : null);
}

module.exports = Xero;
