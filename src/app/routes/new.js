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

    var urls = [
        "https://www.amazon.com/-/es/dp/",
        "https://www.amazon.com/-/es/Nizoral-Anti-Dandruff-Shampoo-Ketoconazole-Dandruff/dp/",
        "https://www.amazon.com/dp/",
        "https://www.amazon.com/-/es/AmScope-Kids-M30-ABS-KT2-W-microscopio-microscopios-principiantes/dp/",
        "https://www.amazon.com/-/es/Educational-Insights-GeoSafari-Microscope-Featuring/dp/",
        "https://www.amazon.com/-/es/Libbey-Mixologist-9-Piece-Cocktail-Set/dp/",
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
        var item = user_agent[Math.floor(Math.random() * user_agent.length)];
        var links = urls[Math.floor(Math.random() * urls.length)];
        const url = links + asin_code;

        (async() => {
            let browser = await puppeteer.launch();
            let page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            await page.setUserAgent(item);
            await page.goto(url, { waitUntil: "networkidle2" });
            const userAgent = await page.evaluate(() => navigator.userAgent);
            console.log(userAgent);
            try {
                let data = await page.evaluate(() => {
                    let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
                    let imagen = document.querySelectorAll('.imgTagWrapper img.a-dynamic-image') ? document.querySelectorAll('.imgTagWrapper img.a-dynamic-image')[0].src : "";
                    let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                    let imagen_dos = document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img') ? document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img').src : "";
                    let peso_prod = "";

                    title = title.replace('Amazon', 'Tienda').trim();
                    precio = precio.replace('US$', '').trim();
                    return {
                        title,
                        imagen,
                        imagen_dos,
                        precio,
                        peso_prod,
                    }

                });
                console.log(data);
                await browser.close();

                connection.query('SELECT * FROM product WHERE asin_code =' + "'" + asin_code + "LIMIT 1'", (error, result) => {
                    if (result) {
                        connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin_code + "'", {
                            name: data.title,
                            img: data.imagen,
                            img2: data.imagen_dos,
                            cost: data.precio,
                            shipping_weight: data.peso_prod,
                            active: data.precio ? 1 : 0,

                        }), (err, result) => {
                            res.redirect('/');
                        }

                    } else {
                        connection.query('INSERT INTO product SET?', {
                            asin_code: asin_code,
                            name: data.title,
                            img: data.imagen,
                            img2: data.imagen_dos,
                            cost: data.precio,
                            shipping_weight: data.peso_prod,
                            active: data.precio ? 1 : 0,

                        }), (err, result) => {
                            res.redirect('/');
                        }
                    }
                });
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

            function playNote(asin_code, i, item) {
                setTimeout(function() {
                    (async() => {
                        console.log(asin_code);
                        var links = urls[Math.floor(Math.random() * urls.length)];
                        const url = links + asin_code;
                        let browser = await puppeteer.launch();
                        let page = await browser.newPage();
                        await page.setDefaultNavigationTimeout(0);
                        await page.setUserAgent(item);
                        await page.goto(url, { waitUntil: "networkidle2" });
                        const userAgent = await page.evaluate(() => navigator.userAgent);
                        try {
                            let data = await page.evaluate(() => {
                                let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
                                let imagen = document.querySelectorAll('.imgTagWrapper img.a-dynamic-image') ? document.querySelectorAll('.imgTagWrapper img.a-dynamic-image')[0].src : "";
                                let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                                let imagen_dos = document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img') ? document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img').src : "";
                                let peso_prod = "";

                                title = title.replace('Amazon', 'Tienda').trim();
                                precio = precio.replace('US$', '').trim();
                                return {
                                    title,
                                    imagen,
                                    imagen_dos,
                                    precio,
                                    peso_prod,
                                }

                            });
                            console.log(data.title ? "exito" : "fail");
                            await browser.close();

                            connection.query('SELECT * FROM product WHERE asin_code =' + "'" + asin_code + "LIMIT 1'", (error, result) => {
                                if (result) {
                                    connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin_code + "'", {
                                        name: data.title,
                                        img: data.imagen,
                                        img2: data.imagen_dos,
                                        cost: data.precio,
                                        shipping_weight: data.peso_prod,
                                        active: data.precio ? 1 : 0,

                                    }), (err, result) => {
                                        res.redirect('/');
                                    }

                                } else {
                                    connection.query('INSERT INTO product SET?', {
                                        asin_code: asin_code,
                                        name: data.title,
                                        img: data.imagen,
                                        img2: data.imagen_dos,
                                        cost: data.precio,
                                        shipping_weight: data.peso_prod,
                                        active: data.precio ? 1 : 0,

                                    }), (err, result) => {
                                        res.redirect('/');
                                    }
                                }
                            });
                            res.redirect('/');

                        } catch (e) {
                            if (e instanceof puppeteer.errors.TimeoutError) {
                                console.log("no carga");
                            }
                        }
                    })();
                }, 15000 * i);
            }
            playRecording()


            res.redirect('/');
        })
    });

    app.post('/pendingproduct', (req, res) => {

        connection.query('SELECT asin_code FROM product WHERE NAME = "" OR NAME IS NULL;', (error, result) => {
            function playRecording3() {
                for (var i = 0; i < result.length; i++) {
                    try {
                        var item = user_agent[Math.floor(Math.random() * user_agent.length)];
                        playNote(result[i].asin_code, i, item);
                    } catch (error) {
                        console.log("error juan:", error.message);
                    }

                };
            }

            async function playNote(asin_code, i, item) {
                setTimeout(async function() {
                    console.log(asin);
                    let browser = await puppeteer.launch();
                    let page = await browser.newPage();
                    await page.setUserAgent(item);
                    await page.goto(url, { waitUntil: "networkidle2" });
                    const userAgent = await page.evaluate(() => navigator.userAgent);
                    console.log(userAgent);
                    try {
                        let data = await page.evaluate(() => {
                            let title = document.querySelector('#productTitle') ? document.querySelector('#productTitle').innerText : "";
                            let imagen = document.querySelectorAll('.imgTagWrapper img.a-dynamic-image') ? document.querySelectorAll('.imgTagWrapper img.a-dynamic-image')[0].src : "";
                            let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                            let imagen_dos = document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img') ? document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img').src : "";
                            let peso_prod = "";

                            title = title.replace('Amazon', 'Tienda').trim();
                            precio = precio.replace('US$', '').trim();
                            return {
                                title,
                                imagen,
                                imagen_dos,
                                precio,
                                peso_prod,
                            }

                        });
                        console.log(data);
                        await browser.close();
                    } catch (error) {
                        console.log(error);
                        res.redirect('/');
                    }
                }, 15000 * i);
            }
            playRecording3();

            res.redirect('/');

        }), (err, result) => {
            console.log(err);
        }
    });

    app.post('/pendingproduct1', (req, res) => {

        const putRequest = async(url, userAgent) => {
            try {
                request({
                        url: url,
                        method: "GET",
                        headers: {
                            'User-Agent': userAgent
                        },
                    },
                    (err, response, body) => {
                        if (err) {
                            return {
                                status: 400,
                                error: err,
                            }
                        }
                        return {
                            body,
                            status: 200,
                        };
                    }
                );
            } catch (err) {
                return {
                    status: 400,
                    error: err.message,
                }
            }
        };

        connection.query('SELECT asin_code FROM product WHERE NAME = "" OR NAME IS NULL;', (error, result) => {
            function playRecording3() {
                for (var i = 0; i < result.length; i++) {
                    try {
                        var item = user_agent[Math.floor(Math.random() * user_agent.length)];
                        playNote(result[i].asin_code, i, item);
                    } catch (error) {
                        console.log("error juan:", error.message);
                    }

                };
            }

            async function playNote(asin, i, item) {
                setTimeout(async function() {
                    console.log(asin);
                    const url = 'https://www.amazon.com/dp/' + asin;
                    const response = await putRequest(url, item);


                    if (response !== undefined && response !== "undefined") {
                        console.log("entro");
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
                    } else {
                        console.log("respuesta", response);
                    };


                }, 15000 * i);
            }
            playRecording3();

            res.redirect('/');

        }), (err, result) => {
            console.log(err);
        }
    });
}