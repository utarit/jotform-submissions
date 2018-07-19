const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const zipFolder = require('zip-folder');
const rimraf = require('rimraf');

//INITIALIZE APP
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

//MY API KEY
const apiKey = ''; // API KEY COMES HERE!

//ROUTING
app.get('/', (req, res) => {
    res.send('Server is OK')
})

app.get('/:id', (req, res) => {
    const formId = req.params.id;
    const limit = req.query.limit ? req.query.limit : 20;
    const apiUrl = `https://api.jotform.com/form/${formId}/submissions?apiKey=${apiKey}&limit=${limit}`;
    const submissionArray = [];


    request(apiUrl, {json: true}, (err, resp) => {
        if (err) { return console.log(err); }
        
        for(let i = 0; i < resp.body.content.length; i++){
            submissionArray.push(resp.body.content[i].id);
        }
        
    const zipName = `./zip_folder/${formId}[1_${submissionArray.length}].zip`;

        console.time("RUN1");

        puppeteer.launch().then( async browser => {
            const promises = [];

            for(let i = 0; i < submissionArray.length; i++){
                promises.push(browser.newPage().then( async page => {
                    let url = `https://www.jotform.com/pdf-designer/#/${formId}?preview=true&apiKey=${apiKey}&submission=${submissionArray[i]}`;
                    
                    await page.goto(url, {waitUntil: 'networkidle2'});
                    await page.pdf({path: `./pdfs/submission_${i+1}.pdf`, format: 'A4'});
                    
                }))
            }

            await Promise.all(promises);
            browser.close();
            zipFolder('./pdfs/', zipName , function(err) {
                if(err) {
                    console.log('oxh no!', err);
                } else {
                    res.download(zipName)
                        rimraf('./pdfs/*', function () {  });
                    
                }
            }) 
            

    })

    });

})

const port = 8080;

app.listen(port, () => {
    console.log(`Server is running in port ${port}`)
})