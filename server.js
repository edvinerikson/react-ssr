process.env.NODE_ENV = 'production';

const React = require('React');
const ReactDOMServer = require('./src/ReactDOMServerRenderer');
// const ReactDOMServer = require('react-dom/server');
const http = require('http');
const ReactCoroutine = require('react-dom/lib/ReactCoroutine');
let ops = [];
function Continuation({ isSame }) {
  ops.push(['Continuation', isSame]);
  return <span>{isSame ? 'foo==bar' : 'foo!=bar'}</span>;
}
function A() {
  return <h1>Hello</h1>;
}
// An alternative API could mark Continuation as something that needs
// yielding. E.g. Continuation.yieldType = 123;
function Child({ bar }) {
  ops.push(['Child', bar]);
  return ReactCoroutine.createYield({ bar: bar, }, Continuation, null);
}

function Indirection() {
  ops.push('Indirection');
  return [<Child bar={true} />, <Child bar={false} />];
}

function HandleYields(props, yields) {
  ops.push('HandleYields');
  return yields.map(y =>
    <y.continuation isSame={props.foo === y.props.bar} />
  );
}

// An alternative API could mark Parent as something that needs
// yielding. E.g. Parent.handler = HandleYields;
function Parent(props) {
  ops.push('Parent');
  return ReactCoroutine.createCoroutine(
    props.children,
    HandleYields,
    props
  );
}

// function App() {
//   return <div><Parent foo={true}><Indirection /></Parent></div>;
// }

// expect(ops).toEqual([
//   'Parent',
//   'Indirection',
//   ['Child', true],
//   // Yield
//   ['Child', false],
//   // Yield
//   'HandleYields',
//   // Continue yields
//   ['Continuation', true],
//   ['Continuation', false],
// ]);


// class App extends React.Component {
//   render() {
//     return [
//       <h1>Hello</h1>,
//       <h3>
//         World
//         <span>Child</span>
//       </h3>,
//       [
//         [
//           <p>Paragrah</p>
//         ]
//       ]
//     ];
//   }
// }
const list = new Array(10000).fill(1);
class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello</h1>
        <h3>
          World
          <span>Child</span>
        </h3>
        <p>Paragraph</p>
        <ul>
          {list.map((x, i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    );
  }
}

const server = http.createServer((req, res) => {
  ops = [];
  const stream = ReactDOMServer.renderToStream(<App />);
  stream.pipe(res);
  // res.end(ReactDOMServer.renderToString(<App />));
  // console.log(ops);
});

server.listen(3000);
