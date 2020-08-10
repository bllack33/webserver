const app = require('./config/server');
require('./app/routes/new')(app);

app.listen(app.get('port'), () => {
    console.log('server on port', app.get('port'));
});