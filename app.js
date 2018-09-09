const path = require("path"); //Node.jsの組み込みモジュール   require関数でパッケージを読み込む
const express = require("express"); //Webappフレームワーク
const line = require("@line/bot-sdk"); //LINEのbotSDK

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const lineClient = new line.Client(lineConfig);  //LINEサーバにリクエストを投げるクライアントを生成



var isGameActive = false;

function checkAnswer(userGuess, ans){
  if (userGuess === ans){
    return "ok";
  }
  else if(userGuess < ans){
    return "low";
  }
  else{
    return "high";
  }
}

function createReplyMessage(input) {
  const appUrl = process.env.HEROKU_APP_URL;
  var replyContent = "";
  var answer = 0;
  const quizSize = 7; 

  if(input === "number guessing"){
    answer = Math.ceil(quizSize*Math.random());
    
    isGameActive = true;
    replyContent = "Number guessing game initialized: guess the number by saying one number from 1 to 7.";
    return{
      type: "text",
      text: replyContent
    };
  }else if(isGameActive === true && input === "quit"){
    isGameActive = false;
    replyContent = "Game canceled.";
    return{
      type: "text",
      text: replyContent
    };
  }else if(isGameActive === true && 1 <= parseInt(input,10) <= 7){
    if(checkAnswer(parseInt(input,10), answer)==="ok"){
      isGameActive = false;
      return {
        type: "image",
        previewImageUrl: `${appUrl}images/congratsPre.png`,
        originalContentUrl: `${appUrl}images/congrats.png`
      };
    }else if(checkAnswer(parseInt(input,10), answer)==="low"){
      replyContent = input + ": Your guess is too low.";
      return{
        type: "text",
        text: replyContent
      };
    }else{
      replyContent = input + ": Your guess is too high.";
      return{
        type: "text",
        text: replyContent
      };
    }
    
  }else if(isGameActive === false){
    replyContent = "You said " + input + ". I read you loud and clear. If you want to play number guessing, type 'number guessing'";
    return{
      type: "text",
      text: replyContent
    };
  }else{
    //isGameActiveがtrueなのに1-7とquit以外を答えた
    replyContent = "Invalid answer. If you want to quit, just type 'quit'"
    return{
      type: "text",
      text: replyContent
    };
  }
}

const server = express(); //expressインスタンス生成

server.use("/images", express.static(path.join(__dirname, "images")));

server.post("/webhook", line.middleware(lineConfig), (req, res) => { //サーバからのリクエストを受ける
  // LINEのサーバーに200を返す
  res.sendStatus(200);

  for (const event of req.body.events) {
    if (event.type === "message" && event.message.type === "text") {
      const message = createReplyMessage(event.message.text);
      lineClient.replyMessage(event.replyToken, message);
    }
  }
});

server.listen(process.env.PORT || 8080); //サーバ起動
