const dbConnection = require('../../config/dbConnetion');
const puppeteer = require('puppeteer');


const cheerio = require('cheerio');
const request = require('request-promise');

module.exports = app => {
    const connection = dbConnection();
    var user_agent = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393",
        "Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US",
        "Mozilla/5.0 (iPad; CPU OS 8_4_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12H321 Safari/600.1.4",
        "Lynx/2.8.8pre.4 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/2.12.23",
    ]
    app.get('/', (req, res) => {
        connection.query('SELECT * FROM product ORDER BY id DESC', (error, result) => {
            // console.log(result);
            res.render('news/news.ejs', {
                product: result
            });
        })
    });

    app.post('/product', (req, res) => {

        const { asin_code } = req.body;
        const url = 'https://www.amazon.com/dp/' + asin_code;
        var item = user_agent[Math.floor(Math.random() * user_agent.length)];

        (async() => {
            let browser = await puppeteer.launch();
            let page = await browser.newPage();
            await page.setUserAgent(item);
            await page.goto(url, { waitUntil: "networkidle2" });
            const userAgent = await page.evaluate(() => navigator.userAgent);
            console.log(userAgent);
            try {
                let data = await page.evaluate(() => {
                    let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
                    let imagen = document.querySelector('#imgTagWrapperId img') ? document.querySelector('#imgTagWrapperId img').src : "";
                    let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                    let peso_prod = document.querySelectorAll('.bucket .content ul li').length > 0 ? document.querySelectorAll('.bucket .content ul li')[1].innerText : document.querySelectorAll('#productDetails_detailBullets_sections1 tr')[1].innerText;

                    peso_prod = peso_prod.replace(/[^0-9|\.]/g, '').trim();
                    precio = precio.replace('US$', '').trim();
                    return {
                        title,
                        imagen,
                        precio,
                        peso_prod,
                    }

                });
                console.log(data);
                await browser.close();
                connection.query('INSERT INTO product SET?', {
                    asin_code: asin_code,
                    name: data.title,
                    img: data.imagen,
                    cost: data.precio,
                    shipping_weight: data.peso_prod,
                    active: data.precio ? 1 : 0,

                }), (err, result) => {
                    res.redirect('/');
                }
                connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin + "'", {
                    name: data.title,
                    img: data.imagen,
                    cost: data.precio,
                    shipping_weight: data.peso_prod,
                    active: data.precio ? 1 : 0,

                }), (err, result) => {
                    res.redirect('/');
                }


                res.redirect('/');

            } catch (error) {
                console.log(error);
                res.redirect('/');
            }
        })();
    });


    app.post('/allproduct', (req, res) => {
        connection.query('SELECT * FROM product', (error, result) => {
            console.log(result.length);


            function playRecording() {
                for (var i = 0; i < result.length; i++) {
                    var item = user_agent[Math.floor(Math.random() * user_agent.length)];
                    playNote(result[i].asin_code, i, item);
                };
            }

            function playNote(asin, i, item) {
                setTimeout(function() {
                    (async() => {
                        const url = 'https://www.amazon.com/dp/' + asin;

                        let browser = await puppeteer.launch();
                        let page = await browser.newPage();
                        await page.setUserAgent(item);
                        await page.goto(url, { waitUntil: "networkidle2" });

                        const userAgent = await page.evaluate(() => navigator.userAgent);
                        try {
                            let data = await page.evaluate(() => {

                                let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
                                let imagen = document.querySelector('#imgTagWrapperId img') ? document.querySelector('#imgTagWrapperId img').src : "";
                                let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                                let peso_prod = document.querySelectorAll('.bucket .content ul li').length > 0 ? document.querySelectorAll('.bucket .content ul li')[1].innerText : document.querySelectorAll('#productDetails_detailBullets_sections1 tr')[1].innerText;

                                peso_prod = peso_prod.replace(/[^0-9|\.]/g, '').trim();
                                precio = precio.replace('US$', '').trim();
                                return {
                                    title,
                                    imagen,
                                    precio,
                                    peso_prod,
                                }

                            });
                            await browser.close();
                            connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin + "'", {
                                name: data.title,
                                img: data.imagen,
                                cost: data.precio,
                                shipping_weight: data.peso_prod,
                                active: data.precio ? 1 : 0,

                            }), (err, result) => {
                                res.redirect('/');
                            }
                            console.log("termino");
                            res.redirect('/');

                        } catch (error) {
                            res.redirect('/');
                        }
                    })();
                }, 15000 * i);
            }
            playRecording()


            res.redirect('/');
        })
    });

    app.post('/pendingproduct1', (req, res) => {

        // connection.query('SELECT asin_code FROM product where name IS NULL LIMIT 10', (error, result) => {
        //     console.log("productos faltantes", result.length);

        //     function playRecording3() {
        //         while (result.length > 0) {
        //             chunk = result.splice(0, 1);
        //             for (var i = 0; i < chunk.length; i++) {
        //                 var item = user_agent[Math.floor(Math.random() * user_agent.length)];
        //                 var contador = Math.round(Math.random() * 15000);
        //                 playNote(chunk[i].asin_code, contador, item);
        //             }
        //         };
        //     }

        //     function playNote(asin, i, item) {

        //         setTimeout(function() {
        //             (async() => {
        //                 const url = 'https://www.amazon.com/dp/' + asin;
        //                 let browser = await puppeteer.launch();
        //                 let page = await browser.newPage();
        //                 await page.setUserAgent(item);
        //                 await page.setDefaultNavigationTimeout(0); //no tiene limite de espera
        //                 await page.goto(url, { waitUntil: "networkidle2" });

        //                 const userAgent = await page.evaluate(() => navigator.userAgent);
        //                 try {
        //                     let data = await page.evaluate(() => {

        //                         let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
        //                         let imagen = document.querySelector('#imgTagWrapperId img') ? document.querySelector('#imgTagWrapperId img').src : "";
        //                         let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
        //                         precio = precio.replace('US$', '').trim();
        //                         return {
        //                             title,
        //                             imagen,
        //                             precio,
        //                         }

        //                     });
        //                     await browser.close();
        //                     connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin + "'", {
        //                         name: data.title,
        //                         img: data.imagen,
        //                         cost: data.precio,
        //                         shipping_weight: data.peso_prod,
        //                         active: data.precio ? 1 : 0,

        //                     }), (err, result) => {
        //                         res.redirect('/');
        //                     }
        //                     console.log("termino");
        //                     res.redirect('/');

        //                 } catch (error) {
        //                     res.redirect('/');
        //                 }
        //             })();

        //         }, i);
        //     }
        //     playRecording3();

        //     res.redirect('/');

        // }), (err, result) => {
        //     console.log(err);
        // }
    });

    app.post('/pendingproduct', (req, res) => {

        connection.query('SELECT asin_code FROM product where name IS NULL', (error, result) => {
            // function playRecording3() {
            //     while (result.length > 0) {
            //         chunk = result.splice(0, 2);
            //         for (var i = 0; i < chunk.length; i++) {
            //             var item = user_agent[Math.floor(Math.random() * user_agent.length)];
            //             var contador = Math.round(Math.random() * (5000 - 20000));
            //             playNote(chunk[i].asin_code, contador, item);
            //         }
            //     };
            // }

            function playRecording3() {
                for (var i = 0; i < result.length; i++) {
                    var item = user_agent[Math.floor(Math.random() * user_agent.length)];
                    playNote(result[i].asin_code, i, item);
                };
            }

            async function playNote(asin, i, item) {
                setTimeout(async function() {
                    console.log(asin);
                    const url = 'https://www.amazon.com/-/es/dp/' + asin;
                    const response = await request({
                        uri: url,
                        headers: {
                            'User-Agent': item
                        },
                        gzip: true
                    });
                    let $ = cheerio.load(response);

                    let title = $('#productTitle').text().trim();
                    let imagen = $('#imgTagWrapperId img').attr('src');
                    let precio = $('.a-span12 #priceblock_ourprice') ? $('.a-span12 #priceblock_ourprice').text() : "";
                    let peso_prod = $('#productDetails_detailBullets_sections1 > tbody > tr:nth-child(2) > td').text();

                    peso_prod = peso_prod.replace(/[^0-9|\.]/g, '').trim();
                    precio = precio.replace('US$', '').trim();

                    connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin + "'", {
                        name: title,
                        img: imagen,
                        cost: precio,
                        shipping_weight: peso_prod,
                        active: precio ? 1 : 0,

                    }), (err, result) => {
                        console.log(err.StatusCodeError);
                    }
                }, 15000 * i);
            }
            playRecording3();

            res.redirect('/');

        }), (err, result) => {
            console.log(err);
        }
    });
}