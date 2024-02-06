module.exports = {
    source: {
        include: ['./jj.js', './lib'],
        includePattern: '.+\\.js(doc)?$',
    },
    plugins: [
        "jsdoc-tsimport-plugin"
    ],
    templates: {
        cleverLinks: true,
        monospaceLinks: true,
    },
    opts: {
        recurse: true,
        destination: './docs',
    }
};