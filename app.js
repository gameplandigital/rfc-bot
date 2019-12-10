
const express = require("express"),
  bodyParser = require("body-parser"),
  request = require("request"),
  path = require("path"),
  cors = require("cors"),
  config = require("./config.json"),
  user = require("./components/user"),
  conn = require("./components/connection"),
  moment = require("moment-timezone"),
  mysql = require("mysql");
  moment.tz.setDefault("Asia/Manila");
let app = express();
let con = conn.connection;
const Busboy = require('busboy');
const  AWS = require('aws-sdk');
const fileUpload = require('express-fileupload');
app.use(fileUpload());


//View Engine
app.set("view engine", "ejs");
app.set("public", path.join(__dirname, "public")); 

//Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("X-Frame-Options", "ALLOW-FROM https://www.messenger.com/");
  res.setHeader("X-Frame-Options", "ALLOW-FROM https://www.facebook.com/");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});


//Set Static Path
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

 app.get("/send-concern", (req, res) => {
  const sender_psid = req.query.sender_psid;
  res.render("form", { sender_psid });
});

app.get("/user_create", (req, res) => {
  const sender_psid = req.query.sender_psid;
  res.render("user_create", { sender_psid });
});

 app.get("/aws-upload", (req, res) => {
   const sender_psid = req.query.sender_psid;
   res.render("aws-upload",{ sender_psid });
 });

 app.get("/form", (req, res) => {
  const sender_psid = req.query.sender_psid;
  res.render("form",{ sender_psid });
});



var getConnection =  mysql.createConnection({
    host: "patsydb.com4k2xtorpw.ap-southeast-1.rds.amazonaws.com",
    user: "patsydigital01",
    password: "pAtsy06072018",
    database: "patsy_db",
    multipleStatements: true
  });
  
  getConnection.connect();

app.post("/save-action", (req, res) => {
  const sender_psid = req.body.sender_psid,
  payload = req.body.payload;

  if (payload === "OPEN_SEND_CONCERN_SUCCESS") {
    const message = {
      text: "Thanks! We'll get back to you soon :)",
      quick_replies: [
        {
          content_type: "text",
          title: "Back to Main Menu",
          payload: "MENU_MAIN_MENU"
        }
      ]
    };
    callSendAPI(sender_psid, message);
  }

  user.saveUser(sender_psid, payload, result => {
    if (result.success) {
      res.status(200).send({ success: true });
    } else {
      res.status(200).send({ success: false });
    }
  });
});



const SERVER_URL = config.APP_URL;
console.log(SERVER_URL)



//MAIN MENU
const mainMenu = {
  "persistent_menu": [
    {
        "locale": "default",
        "composer_input_disabled": true,
        "call_to_actions": [
            {
                "type": "postback",
                "title": "MAIN MENU",
                "payload": "MENU_MAIN_MENU"
            },
        ]
     }
  ]
 };
 // END MAIN MENU

 var senderAction = (sender_psid, action) => {
  let request_body = {
    recipient: {
      id: sender_psid
    },
    sender_action: action
  };

  request(
    {
      uri: `https://graph.facebook.com/${config.GRAPH_VERSION}/me/messages`,
      qs: {
        access_token: config.ACCESS_TOKEN
      },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log(body);
        console.log("Action sent!");
      } else {
        console.error("Unable to send action:" + err);
      }
    }
  );
 };

 var callSendAPI = (sender_psid, response) => {
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  request(
    {
      uri: `https://graph.facebook.com/${config.GRAPH_VERSION}/me/messages`,
      qs: {
        access_token: config.ACCESS_TOKEN
      },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log(body);
        console.log("Message sent!");
        senderAction(sender_psid, "typing_off");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
 };

 // FUNCTION THAT HANDLE MESSAGES
 var handleMessage = (sender_psid, received_message) => {
  let response;
  var user_input = received_message.text;

  if (user_input){
    switch (user_input){
      case 'hello':
        greetingMessage(sender_psid);
        break;
      case 'now':
        now(sender_psid);
        break;
    }
  }


};


function greetingMessage(sender_psid){
  let response;
  // let payload = received_postback.payload;

  user.getUserData(sender_psid, result => {
    const user = JSON.parse(result);
    response = {
          text :       
           "Hi There!" +
             user.first_name +
             " 👋\n\nReady to apply for a loan now?",
          quick_replies : [
            {
              content_type: "text",
              title: "Lets go! 👍",
              payload: "APPLY_NOW"                                
            },
            {
              content_type: "text",
              title: "Maybe Later! 👎",
              payload: "MENU_MAIN_MENU"                                
            }
          ]
     }
    callSendAPI(sender_psid, response);
    });

}



function now(sender_psid){
  let response;
  user.getUserData(sender_psid, result => {
    const user = JSON.parse(result);
    response = {
          text :       
           "NOW",
          quick_replies : [
            {
              content_type: "text",
              title: "LATEST UPDATE! 👍",
              payload: "INTERNET"                                
            }
          ]
     }
    callSendAPI(sender_psid, response);
    });

}



function handleAddress(sender_psid, received_message){
  var user_input = received_message.text;

  senderAction(sender_psid, "typing_on");
  response = {
    text: "!! INPUT !!" + user_input.text
  }
    callSendAPI(sender_psid, response);
}


 // FUNCTION THAT HANDLE POSTBACKS
 var handlePostback = (sender_psid, received_postback) => {
  let response;
  let payload = received_postback.payload;

  if (payload === "GET_STARTED") {

    con.query("SELECT getstarted FROM rfc_phase2_users WHERE MessengerId = ?", [sender_psid], 
    (error, result) => {
        con.query("UPDATE rfc_phase2_users SET getstarted = ? WHERE MessengerId = ?",
        ["1", sender_psid])       
      }
    )

    con.query("SELECT get_started_date FROM rfc_apply WHERE MessengerId = ?", [sender_psid], 
    (error, result) => {
        con.query("UPDATE rfc_phase2_users SET getstarted = ? WHERE MessengerId = ?",
          [moment().format("YYYY/MM/DD HH:mm:ss"), sender_psid])       
      }
    )



  
  
    user.getUserData(sender_psid, result => {
    const user = JSON.parse(result);
    senderAction(sender_psid, "typing_on");    
      response = {
         text: "Hi " + user.first_name+ "!" +"\nWhat would you like to do?",
      };
      callSendAPI(sender_psid, response);
    });
  
    setTimeout(function() {
      senderAction(sender_psid, "typing_on");
      response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: 
            [
            {
              title: "Apply Now",              
              image_url: SERVER_URL + "/assets/Applyforaloan.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "APPLY NOW",
                  payload: "APPLY_NOW",                                  
                }
              ],
            },
            {
              title: "Contact An RFC Branch",              
              image_url: SERVER_URL + "/assets/ContactanRFCbranch.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "Where are you located?",
                  payload: "LOCATION",                                  
                }
              ],
            },
            {
              title: "More Information",              
              image_url: SERVER_URL + "/assets/Moreinformation.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "LEARN MORE",
                  payload: "MORE_INFORMATION",                                  
                }
              ],                    
            }
          ]
          }
        }
  };
      callSendAPI(sender_psid, response);
    }, 1500);

  user.saveUser(sender_psid, "QR_USER_AGREE", result => {
    if (result.success) {
      console.log(`Messenger ID ${sender_psid} action saved to the database.`
      );
    }
 });


}


else if (payload === "ACCEPT") {
  senderAction(sender_psid, "typing_on");
  response = {
    text: "Your accessing of the RFC chatbot on Facebook Messenger indicates your understanding, agreement to and acceptance of the Fullterms and Condition and Privacy Policy of the RFC Chatbot. Click the link below if you want to review it \nhttp://www.rfc.com.ph/privacy/",
    quick_replies: [
      {
        content_type : "text",
        title : "I Agree",
        payload : "GET_STARTED"
      }
    ]
};
callSendAPI(sender_psid, response);
}




else if (payload === "MENU_MAIN_MENU") {
      senderAction(sender_psid, "typing_on");
      response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: 
            [
            {
              title: "Apply Now.",              
              image_url: SERVER_URL + "/assets/Applyforaloan.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "APPLY NOW",
                  payload: "APPLY_NOW",                                  
                }
              ],
            },
            {
              title: "Contact An RFC Branch",              
              image_url: SERVER_URL + "/assets/ContactanRFCbranch.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "Where are you located?",
                  payload: "LOCATION",                                  
                }
              ],
            },
            {
              title: "More Information",              
              image_url: SERVER_URL + "/assets/Moreinformation.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "LEARN MORE",
                  payload: "MORE_INFORMATION",                                  
                }
              ],                    
            }
           ]
          }
        }
      };
    callSendAPI(sender_psid, response);
    }
  // ----------- END MAIN MENU --------------

  
 // ---------------------------- APPLY_NOW ---------------------------------
else if (payload === "APPLY_NOW") {

  con.query("SELECT apply_now FROM rfc_apply WHERE user_id = ?", [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET apply_now = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 


    user.getUserData(sender_psid, result => {
    const user = JSON.parse(result);
    response = {
          text :       
           "Ready to answer a couple of questions?",
          quick_replies : [
            {
              content_type: "text",
              title: "Lets go! 👍",
              payload: "APPLY_NOW"                                
            },
            {
              content_type: "text",
              title: "Maybe Later! 👎",
              payload: "MENU_MAIN_MENU"                                
            }
          ]
     }
    callSendAPI(sender_psid, response);
    });
  }


// ************* LOCATION ****************
else if (payload == "LOCATION") {
  senderAction(sender_psid, "typing_on");
  response = {
    text: "Click Where are you located? to recommend the nearest RFC Branch\n(Please make sure to turn on your GPS Location for better results)",
    quick_replies: [
      {
        content_type:"location"
      }
    ]
  }
    callSendAPI(sender_psid, response);
  }



// ************* MORE_INFORMATION ****************
else if (payload == "MORE_INFORMATION") {
  senderAction(sender_psid, "typing_on");
  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [{
          title: "FAQS",
          image_url: SERVER_URL + "/assets/FAQ.jpg",
          buttons: [{
              type: "postback",
              title: "Show list",
              payload: "faq_concern",                                  
            }],
          },{
          title: "Talk to us.",            
          image_url: SERVER_URL + "/assets/Leaveamessage.jpg",
          buttons: [{
              type: "postback",
              title: "Leave us a message.",
              payload: "email_address",                                  
            }],                    
        }]
      }
    }
  }
    callSendAPI(sender_psid, response);
  }

// ************* email_address ****************
else if (payload == "email_address") {
  setTimeout(function(){     
  senderAction(sender_psid, "typing_on");
  response = {   
    text: "send us an email at easyrfc@rfc.com.ph and we will get back to you right away. "                                
  }
  callSendAPI(sender_psid, response);
}, 1200);
    
}






// ************* faq_concern ****************
else if (payload == "faq_concern") {
  senderAction(sender_psid, "typing_on");
  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [{
          title: "APPLICATION & APPROVALS",              
          image_url: SERVER_URL + "/assets/ApplicationsandApprovals.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "FAQ_Application"                                  
            }],
          },{
          title: "FEE'S & REPAYMENT",              
          image_url: SERVER_URL + "/assets/FeesandRepayments.jpg",
          buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "FAQ_Fees"                                  
            }],                    
        }]
      }
    }

  }
    callSendAPI(sender_psid, response);
  }  

// ************* FAQ_Application ****************
else if (payload == "FAQ_Application") {
  senderAction(sender_psid, "typing_on");
  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [{
          title: "HOW TO APPLY FOR A LOAN?",              
          image_url: SERVER_URL + "/assets/HowdoIapply.jpg",
          buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_1",                                  
            }],
          },{
          title: "AM I ELIGIBLE TO APPLY?",              
          image_url: SERVER_URL + "/assets/Eligibletoapply.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_2"                                  
            }],
          },{
          title: "WHAT ARE THE LOAN REQUIREMENT?",              
          image_url: SERVER_URL + "/assets/Requirements.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_3"                                  
            }],
          },{
          title: "HOW WILL I KNOW IF MY LOAN IS APPROVED?",              
          image_url: SERVER_URL + "/assets/Howwilliknowifmyloanisapproved.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_4"                                  
            }],
          },{
          title: "INTERESTED IN RENEWING MY LOAN BUT STILL HAVE A LOAN.",              
          image_url: SERVER_URL + "/assets/carousel6.png",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_5"                                  
            }],
          },{
          title: "HOW DO I RENEW LOAN?",              
          image_url: SERVER_URL + "/assets/HowdoIrenewaloan.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_6"                                  
            }],                    
        }]
      }
    }
}
    callSendAPI(sender_psid, response);
  }  

// ************* FAQ_Fees ****************
else if (payload == "FAQ_Fees") {
  senderAction(sender_psid, "typing_on");
  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [{
          title: "IS THERE AN APPLICATION FEE?",              
          image_url: SERVER_URL + "/assets/Isthereanapplicationfee.jpg",
          buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_10",                                  
            }],
          },{
          title: "HOW WILL I PAY MY AMORTIZATION?",              
          image_url: SERVER_URL + "/assets/HowwillIpaymyamortization.jpg",
           buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_11"                                  
            }],
          },{
          title: "DO I GET A DISCOUNT IF I PAY OFF MY LOAN BEFORE THE MATURITY DATE?",              
          image_url: SERVER_URL + "/assets/DoIgetadiscount.jpg",
          buttons: [{
              type: "postback",
              title: "LEARN MORE",
              payload: "Detls_13"                                  
            }],                    
        }]
      }
    }
}
    callSendAPI(sender_psid, response);
  }  


// ************* Detls_1 ****************
else if (payload == "Detls_1") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Visit loans.rfc.com.ph & apply for a loan!"                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "You may also contact the following numbers so one of our representatives can assist you."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Globe: 09754528368 \n\nSmart: 09195020911"                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "The following are your eligibility requirements:"                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "You should be a Filipino citizen not lower than eighteen (18) years of age"                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Residency of at least two (2) years, except if you are a new home owner"                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Good character & reputation"                                
    }
    callSendAPI(sender_psid, response);
  }, 2900);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "A source of income. If employed, you should have been connected with your current employer for at least two (2) years with a minimum basic monthly salary of Php 18,000."                                
    }
    callSendAPI(sender_psid, response);
  }, 3200);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "If you are a professional or self-employed, you should have been in the same profession or the same business for at least three (3) years, & your business should have been operational for at least two (2) continuous years with profitable operations."                                
    }
    callSendAPI(sender_psid, response);
  }, 3500);




  
}
// ************* Detls_2 ****************
else if (payload == "Detls_2") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "If you are:"                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "- A Filipino citizen"                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "- Not more than 65 years old"                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "- Employed or self-employed for the last one (1) year"                                
    }
    callSendAPI(sender_psid, response);
  }, 2900);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "- Residing in your current address for at least one (1) year"                                
    }
    callSendAPI(sender_psid, response);
  }, 3200);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "- Earning at least P7,500 monthly.\n\nThen you may apply for a loan with us."                                
    }
    callSendAPI(sender_psid, response);
  }, 3500);  
}
// ************* Detls_3 ****************
else if (payload == "Detls_3") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Requirements would depend on the kind of loan product you will avail."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "The interest rates as well as the processing time also vary depending on the type of product that you apply for."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "2 valid government ID’s (if employed, pls include company ID)"                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Proof of Billing"                                
    }
    callSendAPI(sender_psid, response);
  }, 2900);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Proof of Income (3 month payslip)"                                
    }
    callSendAPI(sender_psid, response);
  }, 3200);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Residential, Business, or Employment Address Map"                                
    }
    callSendAPI(sender_psid, response);
  }, 3500); 

setTimeout(function(){     
  senderAction(sender_psid, "typing_on");
  response = {   
    text: "Certificate of Employment"                                
  }
  callSendAPI(sender_psid, response);
}, 3800);  


setTimeout(function(){     
  senderAction(sender_psid, "typing_on");
  response = {   
    text: "Business Barangay/ Business/ DTI Permit (for business owners)"                                
  }
  callSendAPI(sender_psid, response);
}, 4100);  




}
// ************* Detls_4 ****************
else if (payload == "Detls_4") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Apart from receiving SMS notifications, our representative will call to inform you if your application is already approved.\nHe/she will also request you to complete the required documentations & will convey the instructions on how to claim your loan."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);
}
// ************* Detls_5 ****************
else if (payload == "Detls_5") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "There is no need to pay off the loan. You can renew your loan if you have already paid at least fifty percent (50%) of your loan."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "However, the balance will be deducted from the proceeds of your new loan application."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);
}
// ************* Detls_6 ****************
else if (payload == "Detls_6") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Loan renewals are accommodated by our branches."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "You can call our hotline number or proceed directly to the branch who h&les your account."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);
}
// ************* Detls_7 ****************
else if (payload == "Detls_7") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "No need."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "You are only required to send the latest proof of your income or bank statements."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);
}
// ************* Detls_8 ****************
else if (payload == "Detls_8") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Generally, yes. "                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "You may have a higher chance in getting your new loan approved & even a higher loan amount, especially if you have good credit st&ing with us"                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);
}
// ************* Detls_9 ****************
else if (payload == "Detls_9") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Considering that this is a renewal loan application, the procedure will be much shorter. "                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "It is possible that we will request from you updated documents if applicable."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);
}
// ************* Detls_10 ****************
else if (payload == "Detls_10") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Loan Applications done online are free. "                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "RFC application forms from the branches are not for sale."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "But there will be upfront charges like processing/notarial fee if you wish to process your application to your nearest branch."                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);


}
// ************* Detls_11 ****************
else if (payload == "Detls_11") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Post-dated Checks (PDC) are required for loans amounting to Php100,000 & above.\nUpon the release of your loan, you may issue PDCs as a form of security of payment to us. Payments may also be made thru our payment channel partners"                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);
}
// ************* Detls_12 ****************
else if (payload == "Detls_12") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Please get in touch with our RFC Branch Manager that h&les your account for proper resolution of your problem."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);
}
// ************* Detls_13 ****************
else if (payload == "Detls_13") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Yes, you will."                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Please contact the RFC branch that handles your account & they will provide you with the computation for your refund."                                
    }
    callSendAPI(sender_psid, response);
  }, 2300);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "If you applied through our online portal, kindly contact the following numbers."                                
    }
    callSendAPI(sender_psid, response);
  }, 2600);

  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "Globe: 09754528368 \n\n Smart: 09195020911"                                
    }
    callSendAPI(sender_psid, response);
  }, 2900);
}

// ************* YEARS_STAY ****************
else if (payload == "YEARS_STAY") {
  setTimeout(function(){     
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "How many years you have been staying there? 📆"                                
    }
    callSendAPI(sender_psid, response);
  }, 2000);
}


 user.saveUser(sender_psid, payload, result => {
   if (result.success) {
     console.log(`Messenger ID ${sender_psid} action saved to the database.`);
   }
 });


};




var handleQuickReply = (sender_psid, received_postback, received_message, callback) => {
  let response;
  let payload = received_postback.payload;
  // var user_input = received_message.text;

  if (payload === "GET_STARTED") {

    con.query("SELECT getstarted FROM rfc_phase2_users WHERE MessengerId = ?", [sender_psid], 
    (error, result) => {
        con.query("UPDATE rfc_phase2_users SET getstarted = ? WHERE MessengerId = ?",
        ["1", sender_psid])       
      }
    )

    con.query("SELECT get_started_date FROM rfc_apply WHERE MessengerId = ?", [sender_psid], 
    (error, result) => {
        con.query("UPDATE rfc_phase2_users SET getstarted = ? WHERE MessengerId = ?",
          [moment().format("YYYY/MM/DD HH:mm:ss"), sender_psid])       
      }
    )



  
  
    user.getUserData(sender_psid, result => {
    const user = JSON.parse(result);
    senderAction(sender_psid, "typing_on");    
      response = {
         text: "Hi " + user.first_name+ "!" +"\nWhat would you like to do?",
      };
      callSendAPI(sender_psid, response);
    });
  
    setTimeout(function() {
      senderAction(sender_psid, "typing_on");
      response = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: 
            [
            {
              title: "Apply Now",              
              image_url: SERVER_URL + "/assets/Applyforaloan.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "APPLY NOW",
                  payload: "APPLY_NOW",                                  
                }
              ],
            },
            {
              title: "Contact An RFC Branch",              
              image_url: SERVER_URL + "/assets/ContactanRFCbranch.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "Where are you located?",
                  payload: "LOCATION",                                  
                }
              ],
            },
            {
              title: "More Information",              
              image_url: SERVER_URL + "/assets/Moreinformation.jpg",
              buttons: 
              [
                {
                  type: "postback",
                  title: "LEARN MORE",
                  payload: "MORE_INFORMATION",                                  
                }
              ],                    
            }
          ]
          }
        }
  };
      callSendAPI(sender_psid, response);
    }, 1500);

  user.saveUser(sender_psid, "QR_USER_AGREE", result => {
    if (result.success) {
      console.log(`Messenger ID ${sender_psid} action saved to the database.`
      );
    }
 });


}

  
  // ---- GREETINGS ----
 else if (payload === "MENU_MAIN_MENU") {
    senderAction(sender_psid, "typing_on");
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: 
          [
          {
            title: "Apply Now.",              
            image_url: SERVER_URL + "/assets/Applyforaloan.jpg",
            buttons: 
            [
              {
                type: "postback",
                title: "APPLY NOW",
                payload: "APPLY_NOW",                                  
              }
            ],
          },
          {
            title: "Contact An RFC Branch",              
            image_url: SERVER_URL + "/assets/ContactanRFCbranch.jpg",
            buttons: 
            [
              {
                type: "postback",
                title: "Where are you located?",
                payload: "LOCATION",                                  
              }
            ],
          },
          {
            title: "More Information",              
            image_url: SERVER_URL + "/assets/Moreinformation.jpg",
            buttons: 
            [
              {
                type: "postback",
                title: "LEARN MORE",
                payload: "MORE_INFORMATION",                                  
              }
            ],                    
          }
         ]
        }
      }
  };
    callSendAPI(sender_psid, response);
}

 // ************* APPLY_NOW ****************
 else if (payload == "APPLY_NOW") {

  con.query("SELECT * FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
    if (result.length == 0) {
      con.query("INSERT INTO rfc_apply (user_id) VALUES (?)",
        [sender_psid]
        )       
      }
    }
  )

   setTimeout(function(){
    senderAction(sender_psid, "typing_on");
    response = {   
      text: "(1/15) What is your marital status?",
      quick_replies:[
        {
          content_type : "text",
          title : "Single ",
          payload : "SINGLE"
        },
        {
          content_type : "text",
          title : "Widower",
          payload : "WIDOWER"
        },
        {
          content_type : "text",
          title : "Common Law",
          payload : "COMMON-LAW"
        },
        {
          content_type : "text",
          title : "Married",
          payload : "MARRIED"
        },
        {
          content_type : "text",
          title : "Separated",
          payload : "SEPARATED"
        },
        {
          content_type : "text",
          title : "Go Back",
          payload : "MENU_MAIN_MENU"
        }
      ]
    }
    callSendAPI(sender_psid, response);
}, 2000);
 }  


 // ************* SINGLE ****************
 else if (payload == "SINGLE") {
   
  con.query("SELECT marital_status FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET marital_status = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

 senderAction(sender_psid, "typing_on");
  response = {   
     text : "(2/15) What is your gender ?",
     quick_replies:[
      {
        content_type : "text",
        title : "Male ♂️",
        payload : "MALE"
      },
      {
        content_type : "text",
        title : "Female ♀️",
        payload : "FEMALE"
      },
    ] 
  } 
  callSendAPI(sender_psid, response);
}  
// ************* WIDOWER ****************
 else if (payload == "WIDOWER") {

  con.query("SELECT marital_status FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET marital_status = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(2/15) What is your gender ?",
      quick_replies:[
       {
         content_type : "text",
         title : "Male ♂️",
         payload : "MALE"
       },
       {
         content_type : "text",
         title : "Female ♀️",
         payload : "FEMALE"
       },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COMMON-LAW ****************
 else if (payload == "COMMON-LAW") {

    con.query("SELECT marital_status FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
        con.query("UPDATE rfc_apply SET marital_status = ? WHERE user_id = ?",
        [payload, sender_psid])       
      }
    ) 

    senderAction(sender_psid, "typing_on");
     response = {   
        text : "(2/15) What is your gender ?",
        quick_replies:[
         {
           content_type : "text",
           title : "Male ♂️",
           payload : "MALE"
         },
         {
           content_type : "text",
           title : "Female ♀️",
           payload : "FEMALE"
        }, 
       ] 
     } 
     callSendAPI(sender_psid, response);
 }  
// ************* MARRIED ****************
 else if (payload == "MARRIED") {

  con.query("SELECT marital_status FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET marital_status = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(2/15) What is your gender ?",
      quick_replies:[
       {
         content_type : "text",
         title : "Male ♂️",
         payload : "MALE"
       },
       {
         content_type : "text",
         title : "Female ♀️",
         payload : "FEMALE"
       },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* SEPARATED ****************
 else if (payload == "SEPARATED") {

  con.query("SELECT marital_status FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET marital_status = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(2/15) What is your gender ?",
      quick_replies:[
       {
         content_type : "text",
         title : "Male ♂️",
         payload : "MALE"
       },
       {
         content_type : "text",
         title : "Female ♀️",
         payload : "FEMALE"
       },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  

 
// ************* MALE ****************
else if (payload == "MALE") {

  con.query("SELECT gender FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET gender = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(3/15) What is your Educational attainment? 🎓",
      quick_replies:[
       {
         content_type : "text",
         title : "Primary/Elementary",
         payload : "PRIMARY_ELEMENTARY"
       },
       {
         content_type : "text",
         title : "Highschool",
         payload : "HIGHSCHOOL"
       },
       {
         content_type : "text",
         title : "Vocational Graduate",
         payload : "VOCATIONAL_GRADUATE"
       },
       {
         content_type : "text",
         title : "College Graduate",
         payload : "COLLEGE_GRADUATE"
       },
       {
         content_type : "text",
         title : "College Non-Graduate",
         payload : "COLLEGE_NON_GRADUATE"
       },
       {
         content_type : "text",
         title : "Post-graduate / Masters / Phd",
         payload : "POST_GRADUATE_MASTERS_PHD"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* FEMALE ****************
else if (payload == "FEMALE") {

  con.query("SELECT gender FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET gender = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(3/15) What is your Educational attainment? 🎓",
      quick_replies:[
       {
         content_type : "text",
         title : "Primary/Elementary",
         payload : "PRIMARY_ELEMENTARY"
       },
       {
         content_type : "text",
         title : "Highschool",
         payload : "HIGHSCHOOL"
       },
       {
         content_type : "text",
         title : "Vocational Graduate",
         payload : "VOCATIONAL_GRADUATE"
       },
       {
         content_type : "text",
         title : "College Graduate",
         payload : "COLLEGE_GRADUATE"
       },
       {
         content_type : "text",
         title : "College Non-Graduate",
         payload : "COLLEGE_NON_GRADUATE"
       },
       {
         content_type : "text",
         title : "Post-graduate / Masters / Phd",
         payload : "POST_GRADUATE_MASTERS_PHD"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  


// ************* PRIMARY_ELEMENTARY ****************
else if (payload == "PRIMARY_ELEMENTARY") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* HIGHSCHOOL ****************
else if (payload == "HIGHSCHOOL") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* VOCATIONAL_GRADUATE ****************
else if (payload == "VOCATIONAL_GRADUATE") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COLLEGE_GRADUATE ****************
else if (payload == "COLLEGE_GRADUATE") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COLLEGE_NON_GRADUATE ****************
else if (payload == "COLLEGE_NON_GRADUATE") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* POST_GRADUATE_MASTERS_PHD ****************
else if (payload == "POST_GRADUATE_MASTERS_PHD") {

  con.query("SELECT educ_attain FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET educ_attain = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(4/15) What is your nationality?",
      quick_replies:[
       {
         content_type : "text",
         title : "Filipino",
         payload : "FILIPINO"
       },
       {
         content_type : "text",
         title : "Foreign",
         payload : "FOREIGN"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



// ************* FILIPINO ****************
else if (payload == "FILIPINO") {

  con.query("SELECT nationality FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET nationality = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

    setTimeout(function(){     
      senderAction(sender_psid, "typing_on");
      response = {   
         text:
          "(5/15) Are you Employed or Self-employed?",  
            quick_replies:[
            {
              content_type : "text",
              title : "Employed",
              payload : "EMPLOYED"
            },
            {
              content_type : "text",
              title : "Self Employed / Business Owner",
              payload : "SELF_EMPLOYED_BUSINESS_OWNER"
            }
          ] 
     
      };
      callSendAPI(sender_psid, response);
    }, 2000);
  }
// ************* FOREIGN ****************
else if (payload == "FOREIGN") {

  con.query("SELECT nationality FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET nationality = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

    setTimeout(function(){     
      senderAction(sender_psid, "typing_on");
      response = {   
         text:
          "(5/15) Are you Employed or Self-employed?",  
            quick_replies:[
            {
              content_type : "text",
              title : "Employed",
              payload : "EMPLOYED"
            },
            {
              content_type : "text",
              title : "Self Employed / Business Owner",
              payload : "SELF_EMPLOYED_BUSINESS_OWNER"
            }
          ] 
     
      };
      callSendAPI(sender_psid, response);
    }, 2000);
  }



// ************* SELF_EMPLOYED_BUSINESS_OWNER ****************
else if (payload == "SELF_EMPLOYED_BUSINESS_OWNER") {

  con.query("SELECT nature_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET nature_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(6/15) Which industry are you working in?",
    quick_replies:[
     {
       content_type : "text",
       title : "Agricultural Related Services",
       payload : "SELF_AGRICULTURAL_RELATED_SERVICES"
     },
     {
      content_type : "text",
      title : "Business Services",
      payload : "SELF_BUSINESS_SERVICES"
    },
    {
      content_type : "text",
      title : "Computer Hardware & Electronic",
      payload : "SELF_COMPUTER_HARDWARE_ELECTRONIC"
    },
    {
      content_type : "text",
      title : "Computer Software",
      payload : "SELF_COMPUTER_SOFTWARE"
    },
    {
      content_type : "text",
      title : "Education",
      payload : "SELF_EDUCATION"
    },
    {
      content_type : "text",
      title : "Energy and Utilities",
      payload : "SELF_ENERGY_AND_UTILITIES"
    },
    {
      content_type : "text",
      title : "Export Industry",
      payload : "SELF_EXPORT_INDUSTRY"
    },
    {
      content_type : "text",
      title : "Financial Services",
      payload : "SELF_FINANCIAL_SERVICES"
    },
    {
      content_type : "text",
      title : "Fishery",
      payload : "SELF_FISHERY"
    },
    {
      content_type : "text",
      title : "More options",
      payload : "SELF_MORE_OPTIONS"
    },
   ] 
 } 
 callSendAPI(sender_psid, response);
 }  
// ************* EMPLOYED ****************
else if (payload == "EMPLOYED") {

  con.query("SELECT nature_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET nature_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
      text : "(6/15) Which industry are you working in?",
      quick_replies:[
       {
         content_type : "text",
         title : "Agricultural Related Services",
         payload : "AGRICULTURAL_RELATED_SERVICES"
       },
       {
        content_type : "text",
        title : "Business Services",
        payload : "BUSINESS_SERVICES"
      },
      {
        content_type : "text",
        title : "Computer Hardware & Electronic",
        payload : "COMPUTER_HARDWARE_ELECTRONIC"
      },
      {
        content_type : "text",
        title : "Computer Software",
        payload : "COMPUTER_SOFTWARE"
      },
      {
        content_type : "text",
        title : "Education",
        payload : "EDUCATION"
      },
      {
        content_type : "text",
        title : "Energy and Utilities",
        payload : "ENERGY_AND_UTILITIES"
      },
      {
        content_type : "text",
        title : "Export Industry",
        payload : "EXPORT_INDUSTRY"
      },
      {
        content_type : "text",
        title : "Financial Services",
        payload : "FINANCIAL_SERVICES"
      },
      {
        content_type : "text",
        title : "Fishery",
        payload : "FISHERY"
      },
      {
        content_type : "text",
        title : "More options",
        payload : "MORE_OPTIONS"
      },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* MORE_OPTIONS ****************
else if (payload == "MORE_OPTIONS") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Here are the other options",
      quick_replies:[
       {
         content_type : "text",
         title : "Forestry",
         payload : "FORESTRY"
       },
       {
        content_type : "text",
        title : "Health, Pharma Mfg",
        payload : "HEALTH_PHARMA_MFG"
      },
      {
        content_type : "text",
        title : "Livestock & Poultry",
        payload : "LIVESTOCK_POULTRY"
      },
      {
        content_type : "text",
        title : "Manufacturing Business",
        payload : "MANUFACTURING_BUSINESS"
      },
      {
        content_type : "text",
        title : "Media and Entertainment",
        payload : "MEDIA_AND_ENTERTAINMENT"
      },
      {
        content_type : "text",
        title : "Mining & Quarrying",
        payload : "MINING_QUARRYING"
      },
      {
        content_type : "text",
        title : "Real Estate and Construction",
        payload : "REAL_ESTATE_AND_CONSTRUCTION"
      },
      {
        content_type : "text",
        title : "Recreational & Amusement",
        payload : "RECREATIONAL_AMUSEMENT"
      },
      {
        content_type : "text",
        title : "More options",
        payload : "MORE_OPTIONS_1"
      },
      {
        content_type : "text",
        title : "Go Back",
        payload : "EMPLOYED"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* MORE_OPTIONS_1 ****************
else if (payload == "MORE_OPTIONS_1") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Here are more options..",
      quick_replies:[
      {
        content_type : "text",
        title : "Restaurant and Catering",
        payload : "RESTAURANT_AND_CATERING"
      },  
      {
        content_type : "text",
        title : "Retail Trade",
        payload : "RETAIL_TRADE"
      },
      {
        content_type : "text",
        title : "Telecommunications",
        payload : "TELECOMMUNICATIONS"
      },
      {
        content_type : "text",
        title : "Transport Business",
        payload : "TRANSPORT_BUSINESS"
      },
      {
        content_type : "text",
        title : "Wholesale Trade",
        payload : "WHOLESALE_TRADE"
      },
      {
        content_type : "text",
        title : "Go Back",
        payload : "MORE_OPTIONS"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



 // ************* SELF_MORE_OPTIONS ****************
else if (payload == "SELF_MORE_OPTIONS") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Here are the other options",
      quick_replies:[
       {
         content_type : "text",
         title : "Forestry",
         payload : "SELF_FORESTRY"
       },
       {
        content_type : "text",
        title : "Health, Pharma Mfg",
        payload : "SELF_HEALTH_PHARMA_MFG"
      },
      {
        content_type : "text",
        title : "Livestock & Poultry",
        payload : "SELF_LIVESTOCK_POULTRY"
      },
      {
        content_type : "text",
        title : "Manufacturing Business",
        payload : "SELF_MANUFACTURING_BUSINESS"
      },
      {
        content_type : "text",
        title : "Media and Entertainment",
        payload : "SELF_MEDIA_AND_ENTERTAINMENT"
      },
      {
        content_type : "text",
        title : "Mining & Quarrying",
        payload : "SELF_MINING_QUARRYING"
      },
      {
        content_type : "text",
        title : "Real Estate and Construction",
        payload : "SELF_REAL_ESTATE_AND_CONSTRUCTION"
      },
      {
        content_type : "text",
        title : "Recreational & Amusement",
        payload : "SELF_RECREATIONAL_AMUSEMENT"
      },
      {
        content_type : "text",
        title : "More options",
        payload : "SELF_MORE_OPTIONS_1"
      },
      {
        content_type : "text",
        title : "Go Back",
        payload : "SELF_EMPLOYED_BUSINESS_OWNER"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* SELF_MORE_OPTIONS_1 ****************
else if (payload == "SELF_MORE_OPTIONS_1") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Here are more options..",
      quick_replies:[
        {
          content_type : "text",
          title : "Restaurant and Catering",
          payload : "SELF_RESTAURANT_AND_CATERING"
        },
       {
         content_type : "text",
         title : "Retail Trade",
         payload : "SELF_RETAIL_TRADE"
       },
       {
        content_type : "text",
        title : "Telecommunications",
        payload : "SELF_TELECOMMUNICATIONS"
      },
      {
        content_type : "text",
        title : "Transport Business",
        payload : "SELF_TRANSPORT_BUSINESS"
      },
      {
        content_type : "text",
        title : "Wholesale Trade",
        payload : "SELF_WHOLESALE_TRADE"
      },
      {
        content_type : "text",
        title : "Go Back",
        payload : "SELF_MORE_OPTIONS"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



// ************* AGRICULTURAL_RELATED_SERVICES ****************
else if (payload == "AGRICULTURAL_RELATED_SERVICES") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position? What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* BUSINESS_SERVICES ****************
else if (payload == "BUSINESS_SERVICES") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COMPUTER_HARDWARE_ELECTRONIC ****************
else if (payload == "COMPUTER_HARDWARE_ELECTRONIC") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COMPUTER_SOFTWARE ****************
else if (payload == "COMPUTER_SOFTWARE") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EDUCATION ****************
else if (payload == "EDUCATION") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* ENERGY_AND_UTILITIES ****************
else if (payload == "ENERGY_AND_UTILITIES") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EXPORT_INDUSTRY ****************
else if (payload == "EXPORT_INDUSTRY") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* FINANCIAL_SERVICES ****************
else if (payload == "FINANCIAL_SERVICES") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* FISHERY ****************
else if (payload == "FISHERY") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* FORESTRY ****************
else if (payload == "FORESTRY") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* HEALTH_PHARMA_MFG ****************
else if (payload == "HEALTH_PHARMA_MFG") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* COMPUTER_SOFTWARE ****************
else if (payload == "LIVESTOCK_POULTRY") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* MANUFACTURING_BUSINESS ****************
else if (payload == "MANUFACTURING_BUSINESS") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* MEDIA_AND_ENTERTAINMENT ****************
else if (payload == "MEDIA_AND_ENTERTAINMENT") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* MINING_QUARRYING ****************
else if (payload == "MINING_QUARRYING") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* REAL_ESTATE_AND_CONSTRUCTION ****************
else if (payload == "REAL_ESTATE_AND_CONSTRUCTION") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* RECREATIONAL_AMUSEMENT ****************
else if (payload == "RECREATIONAL_AMUSEMENT") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* RESTAURANT_AND_CATERING ****************
else if (payload == "RESTAURANT_AND_CATERING") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* RETAIL_TRADE ****************
else if (payload == "RETAIL_TRADE") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* TELECOMMUNICATIONS ****************
else if (payload == "TELECOMMUNICATIONS") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* TRANSPORT_BUSINESS ****************
else if (payload == "TRANSPORT_BUSINESS") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* WHOLESALE_TRADE ****************
else if (payload == "WHOLESALE_TRADE") {
  
    con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
      [sender_psid], 
      (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(7/15) How about your position?What's your position there?",
      quick_replies:[
       {
         content_type : "text",
         title : "Staff",
         payload : "STAFF"
       },
       {
        content_type : "text",
        title : "Office/Manager",
        payload : "OFFICE_MANAGER"
      },
      {
        content_type : "text",
        title : "Executive",
        payload : "EXECUTIVE"
      },
      {
        content_type : "text",
        title : "Professional",
        payload : "PROFESSIONAL"
      },
      {
        content_type : "text",
        title : "OCW/OFW",
        payload : "OCW_OFW"
      }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



// ************* SELF_AGRICULTURAL_RELATED_SERVICES ****************
else if (payload == "SELF_AGRICULTURAL_RELATED_SERVICES") {

  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["AGRICULTURAL_RELATED_SERVICES", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_BUSINESS_SERVICES ****************
else if (payload == "SELF_BUSINESS_SERVICES") {

  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["BUSINESS_SERVICES", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_COMPUTER_HARDWARE_ELECTRONIC ****************
else if (payload == "SELF_COMPUTER_HARDWARE_ELECTRONIC") {

  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["COMPUTER_HARDWARE_ELECTRONIC", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_COMPUTER_SOFTWARE ****************
else if (payload == "SELF_COMPUTER_SOFTWARE") {

  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["COMPUTER_SOFTWARE", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_EDUCATION ****************
else if (payload == "SELF_EDUCATION") {
  
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["EDUCATION", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_ENERGY_AND_UTILITIES ****************
else if (payload == "SELF_ENERGY_AND_UTILITIES") {
  
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["ENERGY_AND_UTILITIES", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_EXPORT_INDUSTRY ****************
else if (payload == "SELF_EXPORT_INDUSTRY") {
    
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["EXPORT_INDUSTRY", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_FINANCIAL_SERVICES ****************
else if (payload == "SELF_FINANCIAL_SERVICES") {
      
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["FINANCIAL_SERVICES", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_FISHERY ****************
else if (payload == "SELF_FISHERY") {
        
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["FISHERY", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_FORESTRY ****************
else if (payload == "SELF_FORESTRY") {
  
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["FORESTRY", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_HEALTH_PHARMA_MFG ****************
else if (payload == "SELF_HEALTH_PHARMA_MFG") {
    
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["HEALTH_PHARMA_MFG", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_LIVESTOCK_POULTRY ****************
else if (payload == "SELF_LIVESTOCK_POULTRY") {
      
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["LIVESTOCK_POULTRY", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_MANUFACTURING_BUSINESS ****************
else if (payload == "SELF_MANUFACTURING_BUSINESS") {
        
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["MANUFACTURING_BUSINESS", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_MEDIA_AND_ENTERTAINMENT ****************
else if (payload == "SELF_MEDIA_AND_ENTERTAINMENT") {
          
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["MEDIA_AND_ENTERTAINMENT", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_MINING_QUARRYING ****************
else if (payload == "SELF_MINING_QUARRYING") {
            
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["MINING_QUARRYING", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_REAL_ESTATE_AND_CONSTRUCTION ****************
else if (payload == "SELF_REAL_ESTATE_AND_CONSTRUCTION") {
              
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["REAL_ESTATE_AND_CONSTRUCTION", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_RECREATIONAL_AMUSEMENT ****************
else if (payload == "SELF_RECREATIONAL_AMUSEMENT") {
                
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["RECREATIONAL_AMUSEMENT", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_RESTAURANT_AND_CATERING ****************
else if (payload == "SELF_RESTAURANT_AND_CATERING") {
                  
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["RESTAURANT_AND_CATERING", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_RETAIL_TRADE ****************
else if (payload == "SELF_RETAIL_TRADE") {
                    
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["RETAIL_TRADE", sender_psid])       
    }
  ) 


  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_TELECOMMUNICATIONS ****************
else if (payload == "SELF_TELECOMMUNICATIONS") {
                      
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["TELECOMMUNICATIONS", sender_psid])       
    }
  ) 


  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_TRANSPORT_BUSINESS ****************
else if (payload == "SELF_TRANSPORT_BUSINESS") {

  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["TRANSPORT_BUSINESS", sender_psid])       
    }
  ) 


  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  
// ************* SELF_WHOLESALE_TRADE ****************
else if (payload == "SELF_WHOLESALE_TRADE") {

  
  con.query("SELECT sector FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET sector = ? WHERE user_id = ?",
      ["WHOLESALE_TRADE", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
     response = {   
      text : "(8/15) How many years have you been working? 🤷",
       quick_replies:[
         {
           content_type : "text",
           title : "0 - 10",
           payload : "EMP_0_10"
         },
         {
           content_type : "text",
           title : "11 - 20",
           payload : "EMP_11_20"
         }, 
         {
           content_type : "text",
           title : "21 - 30",
           payload : "EMP_21_30"
         },
         {
           content_type : "text",
           title : "31 - 40",
           payload : "EMP_31_40"
         },
         {
           content_type : "text",
           title : "41 - 50",
           payload : "EMP_41_50"
         },
         {
           content_type : "text",
           title : "51 - 60",
           payload : "EMP_51_60"
         },
      ] 
    } 
    callSendAPI(sender_psid, response);
 }  



// ************* STAFF ****************
else if (payload == "STAFF") {

  con.query("SELECT position FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET position = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  console.log("-----------------------------------")
  console.log(payload)
  console.log("-----------------------------------")


  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(8/15) How many years have you been working? 🤷",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 10",
          payload : "EMP_0_10"
        },
        {
          content_type : "text",
          title : "11 - 20",
          payload : "EMP_11_20"
        }, 
        {
          content_type : "text",
          title : "21 - 30",
          payload : "EMP_21_30"
        },
        {
          content_type : "text",
          title : "31 - 40",
          payload : "EMP_31_40"
        },
        {
          content_type : "text",
          title : "41 - 50",
          payload : "EMP_41_50"
        },
        {
          content_type : "text",
          title : "51 - 60",
          payload : "EMP_51_60"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* OFFICE_MANAGER ****************
else if (payload == "OFFICE_MANAGER") {

  con.query("SELECT position FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET position = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
 
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(8/15) How many years have you been working? 🤷",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 10",
          payload : "EMP_0_10"
        },
        {
          content_type : "text",
          title : "11 - 20",
          payload : "EMP_11_20"
        }, 
        {
          content_type : "text",
          title : "21 - 30",
          payload : "EMP_21_30"
        },
        {
          content_type : "text",
          title : "31 - 40",
          payload : "EMP_31_40"
        },
        {
          content_type : "text",
          title : "41 - 50",
          payload : "EMP_41_50"
        },
        {
          content_type : "text",
          title : "51 - 60",
          payload : "EMP_51_60"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EXECUTIVE ****************
else if (payload == "EXECUTIVE") {

  con.query("SELECT position FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET position = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(8/15) How many years have you been working? 🤷",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 10",
          payload : "EMP_0_10"
        },
        {
          content_type : "text",
          title : "11 - 20",
          payload : "EMP_11_20"
        }, 
        {
          content_type : "text",
          title : "21 - 30",
          payload : "EMP_21_30"
        },
        {
          content_type : "text",
          title : "31 - 40",
          payload : "EMP_31_40"
        },
        {
          content_type : "text",
          title : "41 - 50",
          payload : "EMP_41_50"
        },
        {
          content_type : "text",
          title : "51 - 60",
          payload : "EMP_51_60"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* PROFESSIONAL ****************
else if (payload == "PROFESSIONAL") {

  con.query("SELECT position FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET position = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(8/15) How many years have you been working? 🤷",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 10",
          payload : "EMP_0_10"
        },
        {
          content_type : "text",
          title : "11 - 20",
          payload : "EMP_11_20"
        }, 
        {
          content_type : "text",
          title : "21 - 30",
          payload : "EMP_21_30"
        },
        {
          content_type : "text",
          title : "31 - 40",
          payload : "EMP_31_40"
        },
        {
          content_type : "text",
          title : "41 - 50",
          payload : "EMP_41_50"
        },
        {
          content_type : "text",
          title : "51 - 60",
          payload : "EMP_51_60"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* OCW_OFW ****************
else if (payload == "OCW_OFW") {

  con.query("SELECT position FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET position = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(8/15) How many years have you been working? 🤷",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 10",
          payload : "EMP_0_10"
        },
        {
          content_type : "text",
          title : "11 - 20",
          payload : "EMP_11_20"
        }, 
        {
          content_type : "text",
          title : "21 - 30",
          payload : "EMP_21_30"
        },
        {
          content_type : "text",
          title : "31 - 40",
          payload : "EMP_31_40"
        },
        {
          content_type : "text",
          title : "41 - 50",
          payload : "EMP_41_50"
        },
        {
          content_type : "text",
          title : "51 - 60",
          payload : "EMP_51_60"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



// ************* EMP_0_10 ****************
else if (payload == "EMP_0_10") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
       {
         content_type : "text",
         title : "0",
         payload : "EMP_0"
       },
       {
         content_type : "text",
         title : "1",
         payload : "EMP_1"
       },
       {
         content_type : "text",
         title : "2",
         payload : "EMP_2"
       },
       {
         content_type : "text",
         title : "3",
         payload : "EMP_3"
       },
       {
         content_type : "text",
         title : "4",
         payload : "EMP_4"
       },
       {
         content_type : "text",
         title : "5",
         payload : "EMP_5"
       },
       {
         content_type : "text",
         title : "6",
         payload : "EMP_6"
       },
       {
         content_type : "text",
         title : "7",
         payload : "EMP_7"
       },
       {
         content_type : "text",
         title : "8",
         payload : "EMP_8"
       },
       {
         content_type : "text",
         title : "9",
         payload : "EMP_9"
       },
       {
         content_type : "text",
         title : "10",
         payload : "EMP_10"
       }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EMP_11_20 ****************
else if (payload == "EMP_11_20") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "11",
          payload : "EMP_11"
        },
        {
          content_type : "text",
          title : "12",
          payload : "EMP_12"
        },
        {
          content_type : "text",
          title : "13",
          payload : "EMP_13"
        },
        {
          content_type : "text",
          title : "14",
          payload : "EMP_14"
        },
        {
          content_type : "text",
          title : "15",
          payload : "EMP_15"
        },
        {
          content_type : "text",
          title : "16",
          payload : "EMP_16"
        },
        {
          content_type : "text",
          title : "17",
          payload : "EMP_17"
        },
        {
          content_type : "text",
          title : "18",
          payload : "EMP_18"
        },
        {
          content_type : "text",
          title : "19",
          payload : "EMP_19"
        },
        {
          content_type : "text",
          title : "20",
          payload : "EMP_20"
        } 
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EMP_21_30 ****************
else if (payload == "EMP_21_30") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "21",
          payload : "EMP_21"
        },
        {
          content_type : "text",
          title : "22",
          payload : "EMP_22"
        },
        {
          content_type : "text",
          title : "23",
          payload : "EMP_23"
        },
        {
          content_type : "text",
          title : "24",
          payload : "EMP_24"
        },
        {
          content_type : "text",
          title : "25",
          payload : "EMP_25"
        },
        {
          content_type : "text",
          title : "26",
          payload : "EMP_26"
        },
        {
          content_type : "text",
          title : "27",
          payload : "EMP_27"
        },
        {
          content_type : "text",
          title : "28",
          payload : "EMP_28"
        },
        {
          content_type : "text",
          title : "29",
          payload : "EMP_29"
        },
        {
          content_type : "text",
          title : "30",
          payload : "EMP_30"
        } 
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EMP_31_40 ****************
else if (payload == "EMP_31_40") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "31",
          payload : "EMP_31"
        },
        {
          content_type : "text",
          title : "32",
          payload : "EMP_32"
        },
        {
          content_type : "text",
          title : "33",
          payload : "EMP_33"
        },
        {
          content_type : "text",
          title : "34",
          payload : "EMP_34"
        },
        {
          content_type : "text",
          title : "35",
          payload : "EMP_35"
        },
        {
          content_type : "text",
          title : "36",
          payload : "EMP_36"
        },
        {
          content_type : "text",
          title : "37",
          payload : "EMP_37"
        },
        {
          content_type : "text",
          title : "38",
          payload : "EMP_38"
        },
        {
          content_type : "text",
          title : "39",
          payload : "EMP_39"
        },
        {
          content_type : "text",
          title : "40",
          payload : "EMP_40"
        } 
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EMP_41_50 ****************
else if (payload == "EMP_41_50") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "41",
          payload : "EMP_41"
        },
        {
          content_type : "text",
          title : "42",
          payload : "EMP_42"
        },
        {
          content_type : "text",
          title : "43",
          payload : "EMP_43"
        },
        {
          content_type : "text",
          title : "44",
          payload : "EMP_44"
        },
        {
          content_type : "text",
          title : "45",
          payload : "EMP_45"
        },
        {
          content_type : "text",
          title : "46",
          payload : "EMP_46"
        },
        {
          content_type : "text",
          title : "47",
          payload : "EMP_47"
        },
        {
          content_type : "text",
          title : "48",
          payload : "EMP_48"
        },
        {
          content_type : "text",
          title : "49",
          payload : "EMP_49"
        },
        {
          content_type : "text",
          title : "50",
          payload : "EMP_50"
        } 
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
// ************* EMP_51_60 ****************
else if (payload == "EMP_51_60") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "51",
          payload : "EMP_51"
        },
        {
          content_type : "text",
          title : "52",
          payload : "EMP_52"
        },
        {
          content_type : "text",
          title : "53",
          payload : "EMP_53"
        },
        {
          content_type : "text",
          title : "54",
          payload : "EMP_54"
        },
        {
          content_type : "text",
          title : "55",
          payload : "EMP_55"
        },
        {
          content_type : "text",
          title : "56",
          payload : "EMP_56"
        },
        {
          content_type : "text",
          title : "57",
          payload : "EMP_57"
        },
        {
          content_type : "text",
          title : "58",
          payload : "EMP_58"
        },
        {
          content_type : "text",
          title : "59",
          payload : "EMP_59"
        },
        {
          content_type : "text",
          title : "60",
          payload : "EMP_60"
        } 
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  


 // ************* EMP_0 ****************
else if (payload == "EMP_0") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
  // ************* EMP_1 ****************
else if (payload == "EMP_1") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_2 ****************
 else if (payload == "EMP_2") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_3 ****************
 else if (payload == "EMP_3") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_4 ****************
 else if (payload == "EMP_4") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_5 ****************
 else if (payload == "EMP_5") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_6 ****************
 else if (payload == "EMP_6") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_7 ****************
 else if (payload == "EMP_7") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_8 ****************
 else if (payload == "EMP_8") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_9 ****************
 else if (payload == "EMP_9") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_10 ****************
 else if (payload == "EMP_10") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_11 ****************
 else if (payload == "EMP_11") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_12 ****************
 else if (payload == "EMP_12") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_13 ****************
 else if (payload == "EMP_13") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_14 ****************
 else if (payload == "EMP_14") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_15 ****************
 else if (payload == "EMP_15") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_16 ****************
 else if (payload == "EMP_16") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_17 ****************
 else if (payload == "EMP_17") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_18 ****************
 else if (payload == "EMP_18") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_19 ****************
 else if (payload == "EMP_19") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_20 ****************
 else if (payload == "EMP_20") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_21 ****************
 else if (payload == "EMP_21") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_22 ****************
 else if (payload == "EMP_22") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_23 ****************
 else if (payload == "EMP_23") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_24 ****************
 else if (payload == "EMP_24") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_25 ****************
 else if (payload == "EMP_25") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_26 ****************
 else if (payload == "EMP_26") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_27 ****************
 else if (payload == "EMP_27") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_28 ****************
 else if (payload == "EMP_28") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_29 ****************
 else if (payload == "EMP_29") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_30 ****************
 else if (payload == "EMP_30") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_31 ****************
 else if (payload == "EMP_31") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_32 ****************
 else if (payload == "EMP_32") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
  // ************* EMP_33 ****************
else if (payload == "EMP_33") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_34 ****************
 else if (payload == "EMP_34") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   }  
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_35 ****************
 else if (payload == "EMP_35") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_36 ****************
 else if (payload == "EMP_36") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_37 ****************
 else if (payload == "EMP_37") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_38 ****************
 else if (payload == "EMP_38") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_39 ****************
 else if (payload == "EMP_39") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_40 ****************
 else if (payload == "EMP_40") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_41 ****************
 else if (payload == "EMP_41") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_42 ****************
 else if (payload == "EMP_42") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_43 ****************
 else if (payload == "EMP_43") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_44 ****************
 else if (payload == "EMP_44") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_45 ****************
 else if (payload == "EMP_45") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_46 ****************
 else if (payload == "EMP_46") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_47 ****************
 else if (payload == "EMP_47") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_48 ****************
 else if (payload == "EMP_48") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_49 ****************
 else if (payload == "EMP_49") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_50 ****************
 else if (payload == "EMP_50") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_51 ****************
 else if (payload == "EMP_51") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_52 ****************
 else if (payload == "EMP_52") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_53 ****************
 else if (payload == "EMP_53") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_54 ****************
 else if (payload == "EMP_54") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_55 ****************
 else if (payload == "EMP_55") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_56 ****************
 else if (payload == "EMP_56") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_57 ****************
 else if (payload == "EMP_57") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_58 ****************
 else if (payload == "EMP_58") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_59 ****************
 else if (payload == "EMP_59") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* EMP_60 ****************
 else if (payload == "EMP_60") {
  
  con.query("SELECT years_employment FROM rfc_apply WHERE user_id = ?",
    [sender_psid], 
    (error, result) => {
      con.query("UPDATE rfc_apply SET years_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "(9/15) How about in month(s)?",
      quick_replies:[
        {
          content_type : "text",
          title : "0 - 3",
          payload : "SUB_EMP_MO_1"
        },
        {
          content_type : "text",
          title : "4 - 6",
          payload : "SUB_EMP_MO_2"
        },
        {
          content_type : "text",
          title : "7 - 11",
          payload : "SUB_EMP_MO_3"
        },
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  



 // ************* SUB_EMP_MO_1 ****************
 else if (payload == "SUB_EMP_MO_1") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "0",
          payload : "EMP_MONTHS_0"
        },
        {
          content_type : "text",
          title : "1",
          payload : "EMP_MONTHS_1"
        },
        {
          content_type : "text",
          title : "2",
          payload : "EMP_MONTHS_2"
        },
        {
          content_type : "text",
          title : "3",
          payload : "EMP_MONTHS_3"
        }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* SUB_EMP_MO_2 ****************
 else if (payload == "SUB_EMP_MO_2") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "4",
          payload : "EMP_MONTHS_4"
        },
        {
          content_type : "text",
          title : "5",
          payload : "EMP_MONTHS_5"
        },
        {
          content_type : "text",
          title : "6",
          payload : "EMP_MONTHS_6"
        }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  
 // ************* SUB_EMP_MO_3 ****************
 else if (payload == "SUB_EMP_MO_3") {
  senderAction(sender_psid, "typing_on");
   response = {   
     text : "Please specify 📌",
      quick_replies:[
        {
          content_type : "text",
          title : "7",
          payload : "EMP_MONTHS_7"
        },
        {
          content_type : "text",
          title : "8",
          payload : "EMP_MONTHS_8"
        },
        {
          content_type : "text",
          title : "9",
          payload : "EMP_MONTHS_9"
        },
        {
          content_type : "text",
          title : "10",
          payload : "EMP_MONTHS_10"
        },
        {
          content_type : "text",
          title : "11",
          payload : "EMP_MONTHS_11"
        }
     ] 
   } 
   callSendAPI(sender_psid, response);
 }  




// ************* EMP_MONTHS_0 ****************
else if (payload == "EMP_MONTHS_0") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
     quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);


}
// ************* EMP_MONTHS_1 ****************
else if (payload == "EMP_MONTHS_1") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_2 ****************
else if (payload == "EMP_MONTHS_2") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_3 ****************
else if (payload == "EMP_MONTHS_3") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_4 ****************
else if (payload == "EMP_MONTHS_4") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_5 ****************
else if (payload == "EMP_MONTHS_5") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_6 ****************
else if (payload == "EMP_MONTHS_6") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_7 ****************
else if (payload == "EMP_MONTHS_7") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_8 ****************
else if (payload == "EMP_MONTHS_8") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_9 ****************
else if (payload == "EMP_MONTHS_9") {

 con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_10 ****************
else if (payload == "EMP_MONTHS_10") {

  con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMP_MONTHS_11 ****************
else if (payload == "EMP_MONTHS_11") {

  con.query("SELECT months_employment FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET months_employment = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(10/15) What is the purpose of your loan?",
      quick_replies:[
       {
        content_type : "text",
        title : "Muti-Purpose Cash Loan",
        payload : "MULTI_PURPOSE"
       },
       {
        content_type : "text",
        title : "Business Loan",
        payload : "BUSINESS_LOAN"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
}



// ************* MULTI_PURPOSE ****************
else if (payload == "MULTI_PURPOSE") {

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Kindly chose one from the choices below",
      quick_replies:[
       {
        content_type : "text",
        title : "Medical Assistance",
        payload : "MEDICAL_ASSISTANCE"
       },
       {
        content_type : "text",
        title : "Educational Assistance",
        payload : "EDUCATIONAL_ASSISTANCE"
       },
       {
        content_type : "text",
        title : "Home Improvement",
        payload : "HOME_IMPROVEMENT"
       },
       {
        content_type : "text",
        title : "Emergency Fund",
        payload : "EMERGENCY_FUND"
       },
       {
        content_type : "text",
        title : "Travel / Vacation Fund",
        payload : "TRAVEL_VACATION_FUND"
       },
       {
        content_type : "text",
        title : "Gadget / Application Fund",
        payload : "GADGET_APPLICATION_FUND"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
  
}
// ************* BUSINESS_LOAN ****************
else if (payload == "BUSINESS_LOAN") {

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Kindly chose one from the choices below",
      quick_replies:[
       {
        content_type : "text",
        title : "Working Capital",
        payload : "WORKING_CAPITAL"
       },
       {
        content_type : "text",
        title : "Business Expansion",
        payload : "BUSINESS_EXPANSION"
       },
       {
        content_type : "text",
        title : "Equipment Acquisition",
        payload : "EQUIPMENT_ACQUISITION"
       },
       {
        content_type : "text",
        title : "Franchising",
        payload : "FRANCHISING"
       }
      ]   
  } 
  callSendAPI(sender_psid, response);
  
}






// ************* MEDICAL_ASSISTANCE ****************
else if (payload == "MEDICAL_ASSISTANCE") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* EDUCATIONAL_ASSISTANCE ****************
else if (payload == "EDUCATIONAL_ASSISTANCE") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* HOME_IMPROVEMENT ****************
else if (payload == "HOME_IMPROVEMENT") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* EMERGENCY_FUND ****************
else if (payload == "EMERGENCY_FUND") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* TRAVEL_VACATION_FUND ****************
else if (payload == "TRAVEL_VACATION_FUND") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* GADGET_APPLICATION_FUND ****************
else if (payload == "GADGET_APPLICATION_FUND") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}



// ************* WORKING_CAPITAL ****************
else if (payload == "WORKING_CAPITAL") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* BUSINESS_EXPANSION ****************
else if (payload == "BUSINESS_EXPANSION") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* EQUIPMENT_ACQUISITION ****************
else if (payload == "EQUIPMENT_ACQUISITION") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* FRANCHISING ****************
else if (payload == "FRANCHISING") {
  
  con.query("SELECT loan_purpose FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_purpose = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(13/15) How long do you wish to repay this loan (in months)?",
     quick_replies:[
       {
        content_type : "text",
        title : "0 - 6",
        payload : "TENURE_0_6"
      },
      {
        content_type : "text",
        title : "7 - 12",
        payload : "TENURE_7_12"
      },
      {
        content_type : "text",
        title : "12 - 24",
        payload : "TENURE_12_24"
      },
      {
        content_type : "text",
        title : "24 and above",
        payload : "TENURE_24_ABOVE"
      }
      ]
  } 
  callSendAPI(sender_psid, response);
}







// ************* TENURE_0_6 ****************
else if (payload == "TENURE_0_6") {

  con.query("SELECT tenure_months FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET tenure_months = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(14/15) How much money do you wish to borrow?",
     quick_replies:[
       {
        content_type : "text",
        title : "5,000 - 13,000",
        payload : "5-13"
       },
       {
        content_type : "text",
        title : "14,000 - 22,000",
        payload : "14-22"
       },
       {
        content_type : "text",
        title : "23,000 - 31,000",
        payload : "23-31"
       },
       {
        content_type : "text",
        title : "32,000 - 40,000",
        payload : "32-40"
       },
       {
        content_type : "text",
        title : "41,000 - 50,000",
        payload : "41-50"
       },
       {
        content_type : "text",
        title : "50,000+",
        payload : "50,000+"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}

// ************* TENURE_7_12 ****************
else if (payload == "TENURE_7_12") {

  con.query("SELECT tenure_months FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET tenure_months = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(14/15) How much money do you wish to borrow?",
     quick_replies:[
       {
        content_type : "text",
        title : "5,000 - 13,000",
        payload : "5-13"
       },
       {
        content_type : "text",
        title : "14,000 - 22,000",
        payload : "14-22"
       },
       {
        content_type : "text",
        title : "23,000 - 31,000",
        payload : "23-31"
       },
       {
        content_type : "text",
        title : "32,000 - 40,000",
        payload : "32-40"
       },
       {
        content_type : "text",
        title : "41,000 - 50,000",
        payload : "41-50"
       },
       {
        content_type : "text",
        title : "50,000+",
        payload : "50,000+"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}

// ************* TENURE_12_24 ****************
else if (payload == "TENURE_12_24") {

  con.query("SELECT tenure_months FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET tenure_months = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(14/15) How much money do you wish to borrow?",
     quick_replies:[
       {
        content_type : "text",
        title : "5,000 - 13,000",
        payload : "5-13"
       },
       {
        content_type : "text",
        title : "14,000 - 22,000",
        payload : "14-22"
       },
       {
        content_type : "text",
        title : "23,000 - 31,000",
        payload : "23-31"
       },
       {
        content_type : "text",
        title : "32,000 - 40,000",
        payload : "32-40"
       },
       {
        content_type : "text",
        title : "41,000 - 50,000",
        payload : "41-50"
       },
       {
        content_type : "text",
        title : "50,000+",
        payload : "50,000+"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}

// ************* TENURE_24_ABOVE ****************
else if (payload == "TENURE_24_ABOVE") {

  con.query("SELECT tenure_months FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET tenure_months = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(14/15) How much money do you wish to borrow?",
     quick_replies:[
       {
        content_type : "text",
        title : "5,000 - 13,000",
        payload : "5-13"
       },
       {
        content_type : "text",
        title : "14,000 - 22,000",
        payload : "14-22"
       },
       {
        content_type : "text",
        title : "23,000 - 31,000",
        payload : "23-31"
       },
       {
        content_type : "text",
        title : "32,000 - 40,000",
        payload : "32-40"
       },
       {
        content_type : "text",
        title : "41,000 - 50,000",
        payload : "41-50"
       },
       {
        content_type : "text",
        title : "50,000+",
        payload : "50,000+"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}




// ************* 5-13 ****************
else if (payload == "5-13") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Can you specify the amount?",
     quick_replies:[
       {
        content_type : "text",
        title : "5,000",
        payload : "LOAN_5,000"
       },
       {
        content_type : "text",
        title : "6,000",
        payload : "LOAN_6,000"
       },
       {
        content_type : "text",
        title : "7,000",
        payload : "LOAN_7,000"
       },
       {
        content_type : "text",
        title : "8,000",
        payload : "LOAN_8,000"
       },
       {
        content_type : "text",
        title : "9,000",
        payload : "LOAN_9,000"
       },
       {
        content_type : "text",
        title : "10,000",
        payload : "LOAN_10,000"
       },
       {
        content_type : "text",
        title : "11,000",
        payload : "LOAN_11,000"
       },
       {
        content_type : "text",
        title : "12,000",
        payload : "LOAN_12,000"
       },
       {
        content_type : "text",
        title : "13,000",
        payload : "LOAN_13,000"
       },
       {
        content_type : "text",
        title : "Go Back",
        payload : "TENURE_24_ABOVE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* 14-22 ****************
else if (payload == "14-22") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Can you specify the amount?",
     quick_replies:[
       {
        content_type : "text",
        title : "14,000",
        payload : "LOAN_14,000"
       },
       {
        content_type : "text",
        title : "15,000",
        payload : "LOAN_15,000"
       },
       {
        content_type : "text",
        title : "16,000",
        payload : "LOAN_16,000"
       },
       {
        content_type : "text",
        title : "17,000",
        payload : "LOAN_17,000"
       },
       {
        content_type : "text",
        title : "18,000",
        payload : "LOAN_18,000"
       },
       {
        content_type : "text",
        title : "19,000",
        payload : "LOAN_19,000"
       },
       {
        content_type : "text",
        title : "20,000",
        payload : "LOAN_20,000"
       },
       {
        content_type : "text",
        title : "21,000",
        payload : "LOAN_21,000"
       },
       {
        content_type : "text",
        title : "22,000",
        payload : "LOAN_22,000"
       },
       {
        content_type : "text",
        title : "Go Back",
        payload : "TENURE_24_ABOVE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* 23-31 ****************
else if (payload == "23-31") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Can you specify the amount?",
     quick_replies:[
       {
        content_type : "text",
        title : "23,000",
        payload : "LOAN_23,000"
       },
       {
        content_type : "text",
        title : "24,000",
        payload : "LOAN_24,000"
       },
       {
        content_type : "text",
        title : "25,000",
        payload : "LOAN_25,000"
       },
       {
        content_type : "text",
        title : "26,000",
        payload : "LOAN_26,000"
       },
       {
        content_type : "text",
        title : "27,000",
        payload : "LOAN_27,000"
       },
       {
        content_type : "text",
        title : "28,000",
        payload : "LOAN_28,000"
       },
       {
        content_type : "text",
        title : "29,000",
        payload : "LOAN_29,000"
       },
       {
        content_type : "text",
        title : "30,000",
        payload : "LOAN_30,000"
       },
       {
        content_type : "text",
        title : "31,000",
        payload : "LOAN_31,000"
       },
       {
        content_type : "text",
        title : "Go Back",
        payload : "TENURE_24_ABOVE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* 32-40 ****************
else if (payload == "32-40") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Can you specify the amount?",
     quick_replies:[
       {
        content_type : "text",
        title : "32,000",
        payload : "LOAN_32,000"
       },
       {
        content_type : "text",
        title : "33,000",
        payload : "LOAN_33,000"
       },
       {
        content_type : "text",
        title : "34,000",
        payload : "LOAN_34,000"
       },
       {
        content_type : "text",
        title : "35,000",
        payload : "LOAN_35,000"
       },
       {
        content_type : "text",
        title : "36,000",
        payload : "LOAN_36,000"
       },
       {
        content_type : "text",
        title : "37,000",
        payload : "LOAN_37,000"
       },
       {
        content_type : "text",
        title : "38,000",
        payload : "LOAN_38,000"
       },
       {
        content_type : "text",
        title : "39,000",
        payload : "LOAN_39,000"
       },
       {
        content_type : "text",
        title : "40,000",
        payload : "LOAN_40,000"
       },
       {
        content_type : "text",
        title : "Go Back",
        payload : "TENURE_24_ABOVE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* 41-50 ****************
else if (payload == "41-50") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "Can you specify the amount?",
     quick_replies:[
       {
        content_type : "text",
        title : "41,000",
        payload : "LOAN_41,000"
       },
       {
        content_type : "text",
        title : "42,000",
        payload : "LOAN_42,000"
       },
       {
        content_type : "text",
        title : "43,000",
        payload : "LOAN_43,000"
       },
       {
        content_type : "text",
        title : "44,000",
        payload : "LOAN_44,000"
       },
       {
        content_type : "text",
        title : "45,000",
        payload : "LOAN_45,000"
       },
       {
        content_type : "text",
        title : "46,000",
        payload : "LOAN_46,000"
       },
       {
        content_type : "text",
        title : "47,000",
        payload : "LOAN_47,000"
       },
       {
        content_type : "text",
        title : "48,000",
        payload : "LOAN_48,000"
       },
       {
        content_type : "text",
        title : "49,000",
        payload : "LOAN_49,000"
       },
       {
        content_type : "text",
        title : "50,000",
        payload : "LOAN_50,000"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}






// ************* LOAN_5,000 ****************
else if (payload == "LOAN_5,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["5,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_6,000 ****************
else if (payload == "LOAN_6,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ['6,000', sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_7,000 ****************
else if (payload == "LOAN_7,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["7,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_8,000 ****************
else if (payload == "LOAN_8,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["8,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_9,000 ****************
else if (payload == "LOAN_9,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["9,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_10,000 ****************
else if (payload == "LOAN_10,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["10,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_11,000 ****************
else if (payload == "LOAN_11,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["11,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_12,000 ****************
else if (payload == "LOAN_12,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["12,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_13,000 ****************
else if (payload == "LOAN_13,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["13,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_14,000 ****************
else if (payload == "LOAN_14,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["14,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_15,000 ****************
else if (payload == "LOAN_15,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["15,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_16,000 ****************
else if (payload == "LOAN_16,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["16,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_17,000 ****************
else if (payload == "LOAN_17,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["17,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_18,000 ****************
else if (payload == "LOAN_18,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["18,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_19,000 ****************
else if (payload == "LOAN_19,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["19,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_20,000 ****************
else if (payload == "LOAN_20,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["20,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_21,000 ****************
else if (payload == "LOAN_21,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["21,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_22,000 ****************
else if (payload == "LOAN_22,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["22,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_23,000 ****************
else if (payload == "LOAN_23,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["23,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_24,000 ****************
else if (payload == "LOAN_24,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["24,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_25,000 ****************
else if (payload == "LOAN_25,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["25,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_26,000 ****************
else if (payload == "LOAN_26,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["26,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_27,000 ****************
else if (payload == "LOAN_27,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["27,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_28,000 ****************
else if (payload == "LOAN_28,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["28,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_29,000 ****************
else if (payload == "LOAN_29,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["29,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_30,000 ****************
else if (payload == "LOAN_30,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["30,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_31,000 ****************
else if (payload == "LOAN_31,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["31,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_32,000 ****************
else if (payload == "LOAN_32,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["32,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_33,000 ****************
else if (payload == "LOAN_33,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["33,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_34,000 ****************
else if (payload == "LOAN_34,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["34,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_35,000 ****************
else if (payload == "LOAN_35,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["35,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_36,000 ****************
else if (payload == "LOAN_36,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["36,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_37,000 ****************
else if (payload == "LOAN_37,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["37,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_38,000 ****************
else if (payload == "LOAN_38,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["38,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_39,000 ****************
else if (payload == "LOAN_39,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["39,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_40,000 ****************
else if (payload == "LOAN_40,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["40,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_41,000 ****************
else if (payload == "LOAN_41,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["41,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_42,000 ****************
else if (payload == "LOAN_42,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["42,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_43,000 ****************
else if (payload == "LOAN_43,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["43,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_44,000 ****************
else if (payload == "LOAN_44,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["44,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_45,000 ****************
else if (payload == "LOAN_45,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["45,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_46,000 ****************
else if (payload == "LOAN_46,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["46,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_47,000 ****************
else if (payload == "LOAN_47,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["47,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_48,000 ****************
else if (payload == "LOAN_48,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["48,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_49,000 ****************
else if (payload == "LOAN_49,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["49,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}
// ************* LOAN_50,000 ****************
else if (payload == "LOAN_50,000") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      ["50,000", sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}


// ************* 50,000+ ****************
else if (payload == "50,000+") {

  con.query("SELECT loan_amount_request FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET loan_amount_request = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}





// ************* INFO_MORE ****************
else if (payload == "INFO_MORE") {
  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Phone Directory",
        payload : "PHONE_DIRECTORY"
       },
       {
        content_type : "text",
        title : "Radio Ad",
        payload : "RADIO_AD"
       },
       {
        content_type : "text",
        title : "Relatives",
        payload : "RELATIVES"
       },
       {
        content_type : "text",
        title : "Relative of RFC Employee",
        payload : "RELATIVE_OF_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Repeat Customer",
        payload : "REPEAT_CUSTOMER"
       },
       {
        content_type : "text",
        title : "RFC On Wheels",
        payload : "RFC_ON_WHEELS"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Tarpaulins",
        payload : "TARPAULINS"
       },
       {
        content_type : "text",
        title : "Walk-Ins",
        payload : "WALK_INS"
       },
       {
        content_type : "text",
        title : "Go Back",
        payload : "BACK_TO_INFO"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}

// ************* BACK_TO_INFO ****************
else if (payload == "BACK_TO_INFO") {

  senderAction(sender_psid, "typing_on");
  response = {   
    text : "(15/15) How did you find out about RFC?",
     quick_replies:[
       {
        content_type : "text",
        title : "Branch Personnel/RFC Employee",
        payload : "BRANCH_PERSONNEL_RFC_EMPLOYEE"
       },
       {
        content_type : "text",
        title : "Flyers",
        payload : "FLYERS"
       },
       {
        content_type : "text",
        title : "Friends",
        payload : "FRIENDS"
       },
       {
        content_type : "text",
        title : "Internet",
        payload : "INTERNET"
       },
       {
        content_type : "text",
        title : "LIC",
        payload : "LIC"
       },
       {
        content_type : "text",
        title : "Mall Based BCOs",
        payload : "MALL_BASED_BC_OS"
       },
       {
        content_type : "text",
        title : "MBO (MicroBusOff)",
        payload : "MBO"
       },
       {
        content_type : "text",
        title : "Newspaper",
        payload : "NEWSPAPER"
       },
       {
        content_type : "text",
        title : "Office Signage",
        payload : "OFFICE_SIGNAGE"
       },
       {
        content_type : "text",
        title : "More..",
        payload : "INFO_MORE"
       }
      ]
  } 
  callSendAPI(sender_psid, response);
}



// ************* BRANCH_PERSONNEL_RFC_EMPLOYEE ****************
else if (payload == "BRANCH_PERSONNEL_RFC_EMPLOYEE") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* FLYERS ****************
else if (payload == "FLYERS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* FRIENDS ****************
else if (payload == "FRIENDS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* INTERNET ****************
else if (payload == "INTERNET") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* LIC ****************
else if (payload == "LIC") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* MALL_BASED_BC_OS ****************
else if (payload == "MALL_BASED_BC_OS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* MBO ****************
else if (payload == "MBO") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* NEWSPAPER ****************
else if (payload == "NEWSPAPER") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* OFFICE_SIGNAGE ****************
else if (payload == "OFFICE_SIGNAGE") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* PHONE_DIRECTORY ****************
else if (payload == "PHONE_DIRECTORY") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* RADIO_AD ****************
else if (payload == "RADIO_AD") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* RELATIVES ****************
else if (payload == "RELATIVES") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* REFERRAL ****************
else if (payload == "REFERRAL") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* RELATIVE_OF_RFC_EMPLOYEE ****************
else if (payload == "RELATIVE_OF_RFC_EMPLOYEE") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* REPEAT_CUSTOMER ****************
else if (payload == "REPEAT_CUSTOMER") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* RFC_ON_WHEELS ****************
else if (payload == "RFC_ON_WHEELS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* NEWSPAPER ****************
else if (payload == "NEWSPAPER") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* TARPAULINS ****************
else if (payload == "TARPAULINS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
} 
  callSendAPI(sender_psid, response);
}
// ************* WALK_INS ****************
else if (payload == "WALK_INS") {
  
  con.query("SELECT source_info FROM rfc_apply WHERE user_id = ?",
  [sender_psid], 
  (error, result) => {
      con.query("UPDATE rfc_apply SET source_info = ? WHERE user_id = ?",
      [payload, sender_psid])       
    }
  ) 
  
  senderAction(sender_psid, "typing_on");
   response = {   
      text : "Before continuing, kindly prepare the following strictly on a pdf format with 5MB file size only:\n(2) VALID I.D\nLATEST BILLING\nLATEST PAYSLIP\nYou will be needing this files later.\nThanks." 
   } 
   callSendAPI(sender_psid, response);



  senderAction(sender_psid, "typing_on");
  response = {   
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"You're almost done",
            subtitle:"We just need a few personal information so we can successfuly process your loan application",
            buttons: [
              {
                title: "Let's Go! 👍",
                type: "web_url",
                url:
                config.APP_URL + "/send-concern?sender_psid=" + sender_psid,
                webview_height_ratio: "compact",
                messenger_extensions: true
              }
            ]             
          }
        ]
      }
    }
  } 
  callSendAPI(sender_psid, response);
}


 user.saveUser(sender_psid, payload, result => {
   if (result.success) {
    console.log(`Messenger ID ${sender_psid} action saved to the database.`);
   }
 });

};


// --------------  TO Where are you located? -------------------------------
var handleAttachments = (sender_psid, received_postback) => {
  let response;
  const type = received_postback[0].type;

  if (type === "location") {
    const latitude = received_postback[0].payload.coordinates.lat,
      longitude = received_postback[0].payload.coordinates.long;

          user.getBranches(latitude, longitude, result => {
            // response = {
            //   text:
            //     "Nearest Branch: " +
            //     result[0].name +
            //     "\nAddress: " +
            //     result[0].address +
            //     "\nDistance: " +
            //     result[0].distance.toFixed(1) +
            //     " km",
            //   quick_replies: [
            //     {
            //       content_type: "text",
            //       title: "Back to Main Menu",
            //       payload: "MENU_MAIN_MENU"
            //     }
            //   ]
            // };
            response = {
              text:
                result[0].name +
                result[0].address +
                "\n: " +
                result[0].Sched,
              quick_replies: [
                {
                  content_type: "text",
                  title: "Back to Main Menu",
                  payload: "MENU_MAIN_MENU"
                }
              ]
            };
            callSendAPI(sender_psid, response);
          }
        );
      }
};
// CREATE THE PERSISTENT MENU
var persistentMenu = () => {
  request(
    {
      uri: `https://graph.facebook.com/${
        config.GRAPH_VERSION
      }/me/messenger_profile`,
      qs: {
        access_token: config.ACCESS_TOKEN
      },
      method: "POST",
      json: mainMenu
    },
    (err, res, body) => {
      if (!err) {
        console.log("Persistent menu successfully created.");
      } else {
        console.log("Unable to create persistent menu");
      }
    }
  );
};
// CREATE THE GET STARTED BUTTON
var getStarted = () => {
  let menu = {
    get_started: {
      payload: "ACCEPT"
    },
    whitelisted_domains: [
      config.APP_URL,
      "https://rfc-bot.palmsolutions.co",
      "https://google.com",
      "https://accounts.google.com",
      "https://rfc-bot.herokuapp.com/",
      "https://patsy-official-dashboard.herokuapp.com/counter.php"
        ]
  };

  request(
    {
      uri: `https://graph.facebook.com/${
        config.GRAPH_VERSION
      }/me/messenger_profile`,
      qs: {
        access_token: config.ACCESS_TOKEN
      },
      method: "POST",
      json: menu
    },
    (err, res, body) => {
      if (!err) {
        persistentMenu();
        console.log("Get started button successfully created.");
      } else {
        console.log("Unable to create get started button");
      }
    }
  );
};
getStarted();

// WEBHOOK END POINT
app.post("/webhook", (req, res) => {
  let body = req.body;
  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      senderAction(sender_psid, "mark_seen");

        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event.message);
        if (webhook_event.message.quick_reply) {
          handleQuickReply(sender_psid, webhook_event.message.quick_reply);
        } else if (webhook_event.message.attachments) {
          handleAttachments(sender_psid, webhook_event.message.attachments);
        }
        } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
        } else if (webhook_event.postback) {
        handleAddress(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
          upload(sender_psid, webhook_event.message);
        }
    });
    res.send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});
// WEBHOOK VERIFICATION
app.get("/webhook", (req, res) => {
  let VERIFY_TOKEN = config.VERIFY_TOKEN;
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  console.log(req.query);

  if (mode && token) {
    if (mode == "subscribe" && token == VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.send(challenge);
      res.status(200).send(challenge);
    }
  } else {
    res.sendStatus(404);
  }
});

//--------------------------------------------------------------------------------------------------------------------------------------
app.post('/user_create', (req, res) => {
  console.log("First name: " + req.body.create_first_name)
  console.log("middle name: " + req.body.create_middle_name)
  console.log("last name: " + req.body.create_last_name)
  console.log("MaritalStatus: " + req.body.maritalStatus)
  console.log("Gender: " + req.body.gender)
  console.log("bday: " + req.body.bday)
  console.log("education: " + req.body.education)
  console.log("nationality: " + req.body.nationality)
  console.log("province: " + req.body.province)
  console.log("city: " + req.body.city)
  console.log("barangay: " + req.body.barangay)
  console.log("email: " + req.body.email)
  console.log("number: " + req.body.number)
  console.log("dependents: " + req.body.dependents)
  console.log("nature: " + req.body.nature)
  console.log("sector: " + req.body.sector)
  console.log("monthStay: " + req.body.monthStay)
  console.log("position: " + req.body.position)
  console.log("monthlySalary: " + req.body.monthlySalary)
  console.log("purpose: " + req.body.purpose)
  console.log("collateral: " + req.body.collateral)
  console.log("tenure: " + req.body.tenure)
  console.log("loanAmount: " + req.body.loanAmount)
  console.log("information: " + req.body.information)
  console.log("additional: " + req.body.additional)
  console.log("expense: " + req.body.expense)
  console.log("terms : " + req.body.accept)
  console.log("PSID: " + req.body.sender_psid)

  const firstName = req.body.create_first_name
  const middleName = req.body.create_middle_name
  const lastName = req.body.create_last_name
  const bday = req.body.bday
  const province = req.body.province
  const city = req.body.city
  const barangay = req.body.barangay
  const yearsStay = req.body.yearsStay
  const monthStay = req.body.monthStay
  const email = req.body.email
  const number = req.body.number
  const monthlySalary = req.body.monthlySalary
  const amountRequest = req.body.amountRequest
  const additional = req.body.additional
  const accept = req.body.accept
  const doc1 = req.body.accept
  const doc2 = req.body.doc2
  const doc3 = req.body.doc3
  const doc4 = req.body.doc4

  const psid = req.body.sender_psid

  const queryString = "UPDATE rfc_apply SET fname = ?, mname = ?, lname = ?, birthday = ?,  province = ?, city = ?, barangay = ?, year_stay = ?, month_stay = ?, email = ?, m_number = ?, monthly_salary = ?, loan_amount_request = ?, addition_income = ?, terms_condition = ?, doc1 = ?, doc2 = ?, doc3 = ?, doc4 = ? WHERE user_id = ?"
  getConnection.query(queryString, [firstName, middleName, lastName, bday, province, city, barangay, yearsStay, monthStay, email, number, monthlySalary, amountRequest, additional, accept, doc1, doc2, doc3, doc4, psid], (err, result, fields) =>{
    if (err){
      console.log("FAILED TO INSERT " + err)
      // res.render("marital-status");
      const sender_psid = psid;
      res.render("aws-upload",{ sender_psid });
    }
      console.log("SUCCESSFULLY INSERTED USER");
      const sender_psid = psid;
      res.render("aws-upload",{ sender_psid });
  })
});




var uploadContentToS3 = (file, folder) => {
  const BUCKET_NAME = "rpitv/Patsy/RFC_attachments/" + folder;
  const IAM_USER_KEY = "AKIAJAT7YUJSVKTNAO2A";
  const IAM_USER_SECRET = "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";

  let s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    Bucket: BUCKET_NAME,
    ContentType: "application/pdf"
  });

  s3bucket.createBucket(function() {
    var params = {
      Bucket: BUCKET_NAME,
      Key: file.name,
      Body: file.data
    };
    s3bucket.upload(params, function(err, data) {
      if (err) {
        console.log("error in callback");
        console.log(err);
      }
      console.log("Campaign content uploaded successfully.");
      console.log(data);
      // return data;
    });
  });
};




//S3 UPLOAD
app.post('/api/aws', (req, res) => {

  var payload = "OPEN_SEND_CONCERN_SUCCESS";
  const sender_psid = req.body.psid;

  if (payload === "OPEN_SEND_CONCERN_SUCCESS") {
    const message = {
      text: "Thanks! We'll get back to you soon :)",
      quick_replies: [
        {
          content_type: "text",
          title: "Back to Main Menu",
          payload: "MENU_MAIN_MENU"
        }
      ]
    };
    callSendAPI(sender_psid, message);
  }

  const psid = req.body.psid;
  user.getUserData(psid, result => {
    const user = JSON.parse(result);

  const firstName = user.first_name
  const lastName = user.last_name

  console.log("======================")
  console.log(req.body);
  console.log(psid)
  console.log(firstName)
  console.log(lastName)
  console.log("======================")

  

    const uploadFile = req.files.file;
    const uploadFile2 = req.files.file2;
    const uploadFile3 = req.files.file3;
    const uploadFile4 = req.files.file4;



    var busboy = new Busboy({ headers: req.headers });
    if (uploadFile) {
      busboy.on("file", function(
        fieldname,
        file,
        filename,
        encoding,
        mimetype
      ) {
        console.log(
          "File [" +
            fieldname +
            "]: filename: " +
            filename +
            ", encoding: " +
            encoding +
            ", mimetype: " +
            mimetype
        );
        file.on("data", function(data) {
          console.log("File [" + fieldname + "] got " + data.length + " bytes");
        });
        file.on("end", function() {
          console.log("File [" + fieldname + "] Finished");
        });
      });

      busboy.on("finish", function() {
        let n = `${"01"}_${"ID 1"}_${firstName}_${lastName}`;
        //let extension = `.${mimetype}`;
        console.log(mimetype)
        let fileName = `${n}.${extension}`;
        req.files.file.name = fileName;
        uploadContentToS3(uploadFile, psid, res);

        con.query("SELECT doc1 FROM rfc_apply WHERE user_id = ?",
        [psid], 
        (error, result) => {
            con.query("UPDATE rfc_apply SET doc1 = ? WHERE user_id = ?",
            ["https://rpitv.s3-ap-southeast-1.amazonaws.com/Patsy/RFC_attachments/"+ psid + "/" + fileName, psid])       
          }
        )

        con.query("SELECT id_1 FROM rfc_apply WHERE user_id = ?",
        [psid], 
        (error, result) => {
            con.query("UPDATE rfc_apply SET id_1 = ? WHERE user_id = ?",
            [fileName, psid])
          }
        )

      });
      req.pipe(busboy);



    
    }


     if (uploadFile2) {
       busboy.on("file", function(
         fieldname,
         file,
         filename,
         encoding,
         mimetype
       ) {
         console.log(
           "File [" +
             fieldname +
             "]: filename: " +
             filename +
             ", encoding: " +
             encoding +
             ", mimetype: " +
             mimetype
         );
         file.on("data", function(data) {
           console.log("File [" + fieldname + "] got " + data.length + " bytes");
         });
         file.on("end", function() {
           console.log("File [" + fieldname + "] Finished");
         });
       });

       busboy.on("finish", function() {
         let n = `${"01"}_${"ID 2"}_${firstName}_${lastName}`;
         let extension = `.${mimetype}`;
         let fileName = `${n}${"."}${extension}`;
         req.files.file.name = fileName;
         uploadContentToS3(uploadFile, psid);

         con.query("SELECT doc2 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET doc2 = ? WHERE user_id = ?",
             ["https://rpitv.s3-ap-southeast-1.amazonaws.com/Patsy/RFC_attachments/"+ psid + "/" + fileName, psid])       
           }
         )
 
         con.query("SELECT id_2 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET id_2 = ? WHERE user_id = ?",
             [fileName, psid])       
           }
         )

       });
       req.pipe(busboy);
     }



     if (uploadFile3) {
       busboy.on("file", function(
         fieldname,
         file,
         filename,
         encoding,
         mimetype
       ) {
         console.log(
           "File [" +
             fieldname +
             "]: filename: " +
             filename +
             ", encoding: " +
             encoding +
             ", mimetype: " +
             mimetype
         );
         file.on("data", function(data) {
           console.log("File [" + fieldname + "] got " + data.length + " bytes");
         });
         file.on("end", function() {
           console.log("File [" + fieldname + "] Finished");
         });
       });

       busboy.on("finish", function() {
         let n = `${"01"}_${"BILLING 1"}_${firstName}_${lastName}`;
         let extension = `.${mimetype}`;
         let fileName = `${n}${"."}${extension}`;
         req.files.file.name = fileName;
         uploadContentToS3(uploadFile, psid);

         con.query("SELECT doc3 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET doc3 = ? WHERE user_id = ?",
             ["https://rpitv.s3-ap-southeast-1.amazonaws.com/Patsy/RFC_attachments/"+ psid + "/" + fileName, psid])       
           }
         )
 
         con.query("SELECT bill_1 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET bill_1 = ? WHERE user_id = ?",
             [fileName, psid])       
           }
         )

       });
       req.pipe(busboy);
     }





     if (uploadFile4) {
       busboy.on("file", function(
         fieldname,
         file,
         filename,
         encoding,
         mimetype
       ) {
         console.log(
           "File [" +
             fieldname +
             "]: filename: " +
             filename +
             ", encoding: " +
             encoding +
             ", mimetype: " +
             mimetype
         );
         file.on("data", function(data) {
           console.log("File [" + fieldname + "] got " + data.length + " bytes");
         });
         file.on("end", function() {
           console.log("File [" + fieldname + "] Finished");
         });
       });

       busboy.on("finish", function() {
         let n = `${"01"}_${"BILLING 2"}_${firstName}_${lastName}`;
         let extension = `.${mimetype}`;
         let fileName = `${n}${"."}${extension}`;
         req.files.file.name = fileName;
         uploadContentToS3(uploadFile, psid);


         con.query("SELECT doc4 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET doc4 = ? WHERE user_id = ?",
             ["https://rpitv.s3-ap-southeast-1.amazonaws.com/Patsy/RFC_attachments/"+ psid + "/" + fileName, psid])       
           }
         )
 
         con.query("SELECT bill_2 FROM rfc_apply WHERE user_id = ?",
         [psid], 
         (error, result) => {
             con.query("UPDATE rfc_apply SET bill_2 = ? WHERE user_id = ?",
             [fileName, psid], (err, result, fields) =>{
              if (err){
                console.log(err)
              }
                console.log("SUCCESSFULLY UPDATE USER");
                res.render("user_create");
              })
           }
         )  
       });
       req.pipe(busboy);
     }
  });
});


//S3 UPLOAD END


app.listen(process.env.PORT || 1122, () => {
  console.log("Server is now running.");
});

app.get("/", function(req, res){
    res.send("WEBHOOK WORKING")
});

app.get("/name", function(req, res){
  res.render("views/name");
});
