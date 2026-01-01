import Replicate from "replicate";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import deck from "./deck.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(bodyParser.json());
app.use(cors());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY
});

function formatCardName(name) {
    let periodIdx = name.indexOf('.');
    if (periodIdx < 0) {
        return name;
    }

    return name.substr(periodIdx + 2);
}

function validRequest(request){
    let req = request.body;

    if (!Array.isArray(req)){
        return false;
    }
    if (req.length != 3){
        return false;
    }
    
    for (let card of req){
        
        let name = card.name;
        let foundName = false;
        for (let c of deck){
            
            if (c.name === name){
                foundName = true;
                break;
            }
        }
        if (!foundName){
          return false;
        }
    }
    return true;
}
  

app.post("/", async (request, response) => {
    
    if (!validRequest(request)){
        response.json({
            output: "Request improperly formatted"
        });
        return;
    }
    
    let cards = request.body;
    let promptString = "Create a tarot reading in verse from the following spread: Past=" + formatCardName(cards[0].name) + (cards[0].inverted ? " inverted" : "")
                    + "; Present=" + formatCardName(cards[1].name) + (cards[1].inverted ? " inverted" : "")
                    + "; Future=" + formatCardName(cards[2].name) + (cards[2].inverted ? " inverted" : "");

  const input = {
    prompt: promptString + ". Do not add a title or any markdown or HTML formatting, just return the poem in plain text, formatted with newlines for linebreaks.",
    max_length: 500,
    temperature: 0.7,
  }
  try {
  const result = await replicate.run(
    "qwen/qwen3-235b-a22b-instruct-2507",
    { input }
  );

  console.log("result of AI query: ", result);

  response.json({
    output: result.join(),
  });
  } catch (err) {
    console.log("Error in response from AI: ", err);
    reponse.json({
      output: err
    });
  }

});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
