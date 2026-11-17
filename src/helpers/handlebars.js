
const path = require('path');
const { engine } = require('express-handlebars');

function configureHandlebars(app) {
    const viewsPath = path.join(__dirname, '../views');

    app.engine(
        'handlebars',
        engine({
            extname: '.handlebars',

            defaultLayout: 'user',

            layoutsDir: path.join(
                viewsPath,
                'layouts'
            ),

            partialsDir: [
                {
                    dir: path.join(
                        viewsPath,
                        'partials/user'
                    ),
                    namespace: 'user'
                },
                {
                    dir: path.join(
                        viewsPath,
                        'partials/admin'
                    ),
                    namespace: 'admin'
                }
            ],

           
            helpers: {
                eq: (a, b) => a === b,
                gt: (a, b) => a > b
            }
        })
    );

    app.set('view engine', 'handlebars');
    app.set('views', viewsPath);
}

module.exports = configureHandlebars;
