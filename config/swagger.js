const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'XM Bakeries API',
            version: '1.0.0',
            description: 'XM Bakeries E-commerce API',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local server',
            },
        ],
        components: {              // ← ADD FROM HERE
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [
            { bearerAuth: [] }
        ],                         // ← TO HERE
    },
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);