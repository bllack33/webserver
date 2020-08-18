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

        } catch (e) {
            console.log(puppeteer.errors.TimeoutError);
            if (e instanceof puppeteer.errors.TimeoutError) {
                console.log("no carga");
            }
        }
    })();
});