"use strict";

const request = require("request"),
  moment = require("moment-timezone"),
  config = require("../config.json"),
  conn = require("./connection");

let con = conn.connection;

moment.tz.setDefault("Asia/Manila");

var getUserData = (sender_psid, callback) => {
  request(
    {
      uri: `https://graph.facebook.com/${config.GRAPH_VERSION}/${sender_psid}`,
      qs: {
        fields: "picture.width(300),first_name,last_name",
        access_token: config.ACCESS_TOKEN
      },
      method: "GET"
    },
    (err, res, body) => {
      if (!err) {
        callback(body);
      }
    }
  );
};


var saveUser = (sender_psid, action, callback) => {
  con.query(
    "SELECT * FROM rfc_phase2_users WHERE MessengerId = ?",
    [sender_psid],
    (error, result) => {
      if (error) throw err;
      if (result.length === 0) {
        getUserData(sender_psid, result => {
          const user = JSON.parse(result);
          con.query(
            "INSERT INTO rfc_phase2_users (BotTag, MessengerId, Profile_pic, Fname, Lname, LastActive, FirstOptIn, LastClicked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              "RFC",
              sender_psid,
              user.picture.data.url,
              user.first_name,
              user.last_name,
              moment().format("YYYY/MM/DD HH:mm:ss"),
              moment().format("YYYY/MM/DD HH:mm:ss"),
              action
            ],
            (error2, result2) => {
              if (error2) throw error2;
              if (result2.affectedRows > 0) {
                callback({ success: true });
              } else {
                callback({ success: false });
              }
            }
          );
        });

      }
       else if (result.length > 0) {
         let tag,
           hasTag = false;
        //  if (action === "GET_STARTED") {
        //    tag = { getstarted: 1 };
        //    hasTag = true;
        //  } else if (action === "QR_USER_AGREE") {
        //    tag = { HasDisclaimer: 1 };
        //    hasTag = true;
        //  } else if (action === "MENU_MAIN_MENU") {
        //    tag = { HasDisclaimer: action};
        //    hasTag = true;
        //  } else if (action === "APPLY_NOW") {
        //    tag = { HasDisclaimer: action };
        //    hasTag = true;
        //  } else if (action === "LOCATION") {
        //    tag = { HasDisclaimer: action };
        //    hasTag = true;
        //  }
         con.query(
           "UPDATE rfc_phase2_users SET LastActive = ?, LastClicked = ? WHERE BotTag = ? AND MessengerId = ?",
           [
             moment().format("YYYY/MM/DD HH:mm:ss"),
             action,
             "RFC",
             sender_psid
           ],
           (error2, result2) => {
             if (error2) throw error2;
             if (result2.affectedRows > 0) {
               callback({ success: true });
             } else {
               callback({ success: false });
             }
           }
         );
         
         if (hasTag) {
           con.query(
             "UPDATE rfc_phase2_users SET ? WHERE BotTag = ? AND MessengerId = ?",
             [tag, "rfc_phase2_users", sender_psid],
             (error2, result2) => {
               if (error2) throw error2;
               if (result2.affectedRows > 0) {
                 console.log("Tag saved!");
                 callback({ success: true });
               } else {
                 console.log("Tag saving failed!");
                 callback({ success: false });
               }
             }
           );
         }
       } 
      else {
        callback({ success: false });
      } 
    }
  );
};

var getBranches = (latitude, longitude, callback) => {
  con.query(
    'SELECT id, name, contacts, address, Sched, (6371 * acos(cos(radians("' +
      latitude +
      '")) * cos(radians(lat)) * cos(radians(lng) - radians("' +
      longitude +
      '")) + sin(radians("' +
      latitude +
      '")) * sin(radians(lat )))) AS distance FROM markers WHERE Tag = "RFC" HAVING distance < 25 ORDER BY distance LIMIT 1;',
    function(err, result) {
      if (err) throw err;
      callback(result);
    }
  );
};


module.exports = {
  getUserData,
  saveUser,
  getBranches
};






