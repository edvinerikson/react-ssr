process.env.NODE_ENV = 'production';

const React = require('React');
const ReactDOMServer = require('./src/ReactDOMServerRenderer');
const http = require('http');

class App extends React.Component {
  render() {
    return [
      <h1>Hello</h1>,
      <h3>
        World
        <span>Child</span>
      </h3>,
      [
        [
          <p>Paragrah</p>
        ]
      ]
    ];
  }
}

const server = http.createServer((req, res) => {
  const stream = ReactDOMServer.renderToStream([<App />, <h1>Hello fragment</h1>]);
  stream.pipe(res);
});

server.listen(3000);
