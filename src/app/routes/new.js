const dbConnection = require('../../config/dbConnetion');
const puppeteer = require('puppeteer');
const excel = require('exceljs');
const fs = require('fs');


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
        connection.query('SELECT * FROM product', (error, result) => {
            // console.log(result);
            res.render('news/news.ejs', {
                product: result,
                status: 1,
                message: ""
            });
        })
    });

    app.post('/product', (req, res) => {
        let { asin_code } = req.body;
        asin_code = asin_code.trim();
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
                    let imagen = document.querySelectorAll('#main-image-container > ul li img')[0].src;
                    let description;
                    var tamano = document.querySelectorAll('#feature-bullets ul li').length;
                    for (i = 1; i < tamano; ++i) {
                        var valor = document.querySelectorAll('#feature-bullets ul li')[i].innerText;
                        description = valor ? description + "- " + valor : "";
                    }
                    let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                    let precio_dos = document.querySelector('.a-span12 #priceblock_saleprice') ? document.querySelector('.a-span12 #priceblock_saleprice').innerText : "";
                    let imagen_dos = document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img') ? document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img').src : "";
                    let peso_prod = "";
                    description = description.replace('undefined', '').trim();
                    title = title.replace('Amazon', 'Tienda').trim();
                    precio_dos = precio_dos.replace('US$', '').trim();
                    precio = precio.replace('US$', '').trim();
                    precio_final = precio ? precio : precio_dos;
                    return {
                        title,
                        description,
                        imagen,
                        imagen_dos,
                        precio: precio_final,
                        peso_prod,
                    }

                });
                console.log(data);
                await browser.close();

                connection.query('SELECT * FROM product WHERE asin_code =' + "'" + asin_code + "';", (error, result) => {
                    if (result.length > 0) {
                        connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin_code + "'", {
                            name: data.title,
                            description: data.description,
                            img: data.imagen,
                            img2: data.imagen_dos,
                            cost: data.precio,
                            shipping_weight: data.peso_prod,
                            active: data.precio ? 1 : 0,
                            update: new Date(),

                        }), (err, result) => {
                            res.redirect('/');
                        }
                    } else {
                        connection.query('INSERT INTO product SET?', {
                            asin_code: asin_code,
                            name: data.title,
                            description: data.description,
                            img: data.imagen,
                            img2: data.imagen_dos,
                            cost: data.precio,
                            shipping_weight: data.peso_prod,
                            active: data.precio ? 1 : 0,
                            create: new Date(),

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
        connection.query('SELECT * FROM product WHERE CAST(`update` AS DATE) < CURDATE() OR `update` IS NULL;', (error, result) => {
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
                                let imagen = document.querySelectorAll('#main-image-container > ul li img')[0].src;

                                var tamano = document.querySelectorAll('#feature-bullets ul li').length;
                                let description;
                                for (i = 1; i < tamano; ++i) {
                                    var valor = document.querySelectorAll('#feature-bullets ul li')[i].innerText;
                                    description = valor ? description + "- " + valor : "";
                                }

                                let precio = document.querySelector('.a-span12 #priceblock_ourprice') ? document.querySelector('.a-span12 #priceblock_ourprice').innerText : "";
                                let precio_dos = document.querySelector('.a-span12 #priceblock_saleprice') ? document.querySelector('.a-span12 #priceblock_saleprice').innerText : "";
                                let imagen_dos = document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img') ? document.querySelector('#main-image-container > ul > li.image.item.itemNo1.maintain-height.selected > span > span > div > img').src : "";
                                let peso_prod = "";
                                description = description.replace('undefined', '').trim();
                                title = title.replace('Amazon', 'Tienda').trim();
                                precio_dos = precio_dos.replace('US$', '').trim();
                                precio = precio.replace('US$', '').trim();
                                precio_final = precio ? precio : precio_dos;
                                return {
                                    title,
                                    description,
                                    imagen,
                                    imagen_dos,
                                    precio: precio_final,
                                    peso_prod,
                                }

                            });
                            //console.log(data);
                            console.log(data.title ? "exito" : "fail");
                            await browser.close();

                            connection.query('SELECT * FROM product WHERE asin_code =' + "'" + asin_code + "';", (error, result) => {
                                if (result.length > 0) {
                                    connection.query('UPDATE product SET? WHERE asin_code=' + "'" + asin_code + "'", {
                                        name: data.title,
                                        description: data.description,
                                        img: data.imagen,
                                        img2: data.imagen_dos,
                                        cost: data.precio,
                                        shipping_weight: data.peso_prod,
                                        active: data.precio ? 1 : 0,
                                        update: new Date(),

                                    }), (err, result) => {
                                        res.redirect('/');
                                    }
                                } else {
                                    connection.query('INSERT INTO product SET?', {
                                        asin_code: asin_code,
                                        name: data.title,
                                        description: data.description,
                                        img: data.imagen,
                                        img2: data.imagen_dos,
                                        cost: data.precio,
                                        shipping_weight: data.peso_prod,
                                        active: data.precio ? 1 : 0,
                                        create: new Date(),

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

        connection.query('SELECT * FROM product WHERE CAST(`update` AS DATE) < CURDATE() OR `update` IS NULL;', (error, result) => {
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

                            connection.query('SELECT * FROM product WHERE asin_code =' + "'" + asin_code + "';", (error, result) => {
                                if (result.length > 0) {
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

    app.post('/downloadexcel', (req, res) => {
        

        connection.query('SELECT * FROM product', (error, result) => {
            const jsonProducts = JSON.parse(JSON.stringify(result));
            //console.log(jsonProducts);
            let workbook = new excel.Workbook(); //creating workbook
            let worksheet = workbook.addWorksheet('result'); //creating worksheet
            worksheet.columns = [
                { header: 'Id', key: 'id', width: 10 },
                { header: 'ASIN', key: 'asin_code', width: 30 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Description', key: 'description', width: 30 },
                { header: 'Imagen', key: 'img', width: 10, width: 30 },
                { header: 'Costo USD', key: 'cost', width: 10, width: 10 },
                { header: 'Activo', key: 'active', width: 10, width: 10 },
                { header: 'Fecha de creacion', key: 'create', width: 10, width: 30 },
                { header: 'Fecha de actualizacion', key: 'update', width: 10, width: 30 }
            ];
            worksheet.addRows(jsonProducts);
            const now = new Date();
            const namefile = `${now.getTime()}productos.xlsx`;
            const path = 'src/app/files/';

            workbook.xlsx.writeFile(path + namefile)            
                .then(function() {
                    var files = fs.createReadStream(path + namefile);
                    res.writeHead(200, {
                    "Content-disposition": `attachment; filename=${namefile}`,
                    }); //here you can specify file name
                    files.pipe(res); // also you can set content-type
                    //window.open(namefile, "_blank");
                    setTimeout(function () {
                        fs.unlinkSync(path + namefile);
                      }, 5000);
                });
        })
    });
}