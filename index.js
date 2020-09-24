// works for NODE > v10
const pug = require('pug');
const path = require('path');
require('dotenv').config()
const fs = require("fs");
const axios = require('axios');
var FormData = require('form-data');
//formidable takes the form data and saves the file, and parameterises the fields into JSON
const formidable = require('formidable')
const express = require('express');
const app = express();
var invoiceToken = process.env.invoiceToken;

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
//set up pug as view engine
app.set('view engine','pug');
// https://expressjs.com/en/starter/basic-routing.html


app.get("/", (request, response) => {
    return response.render('index');
});


app.post("/", (request, response) => {

	//this sends in a form with an image
    //formidable reads the form, saves the image
	var form = new formidable.IncomingForm({maxFileSize : 2000 * 1024 * 1024}); //2 Gb
	
	form.parse(request, (err, fields, files) => {
    if (err) {
		  console.error('Error', err);
		  throw err;
    }
	//PARSED FORM
 	console.log("files data", JSON.stringify(files.imageSource));
    var imageName = path.parse(files.imageSource.name).name;
    var imagePath = files.imageSource.path;
    var imageType = files.imageSource.type;
	var imageSize = files.imageSource.size;
	
	//FORMIDIABLE USES A RANDOM NAME ON UPLOAD.  RENAME
	var newImagePath  = imagePath+ imageName;
   fs.rename(imagePath, newImagePath, function (err) {
 	   	if (err) throw err;
 		console.log('File uploaded and moved!');
		//FILE IS RENAMED
		//NOW UPLOAD IT TO MINDEE WITH THE MAKEREQUEST FUNCTION
		makeRequest(newImagePath);
  	});
	
	
		async function makeRequest(newImagePath) {
  		  let data = new FormData()
 		   data.append('file', fs.createReadStream(newImagePath))
	
		//	console.log("form data ", data);
	
 		   const config = {
  			 method: 'POST',
  			   url: 'https://api.mindee.net/products/invoices/v1/predict',
  			   headers: { 
  				   'X-Inferuser-Token':invoiceToken,
  				   ...data.getHeaders()
 				  },
				  data
 			  }
			  console.log("config" ,config);
			  try {
				  let apiResponse = await axios(config)
				  console.log(" api response", apiResponse.data);
				  
				  
				  
		 		  //pull out the data I want to show on the page
				  var currency = apiResponse.data.predictions[0].locale.currency;
				  var invoice = apiResponse.data.predictions[0].invoice_number.value;
				  var merchant = apiResponse.data.predictions[0].supplier.value;
				  var date = apiResponse.data.predictions[0].invoice_date.iso;
				  var beforeTax = apiResponse.data.predictions[0].total_excl.amount;
				  var total = apiResponse.data.predictions[0].total_incl.amount
				  console.log("invoice", invoice);
				  console.log("currency", currency);
				  console.log("merchant" ,merchant);
				  console.log("date" , date);
				  console.log("beforeTax" , beforeTax);
				  console.log("total" , total);

			
			
			
				  console.log (invoice, currency, merchant, date, beforeTax, total);
				  return response.render('invoice',{invoice, currency, merchant, date, beforeTax, total});
				  
			  } catch (error) {
 				  console.log(error)
 			  }

		  }
		  makeRequest()
	 });
});






// listen for requests :)
const listener = app.listen(3003, () => {
  console.log("Your app is listening on port " + listener.address().port);
});