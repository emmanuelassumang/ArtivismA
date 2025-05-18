import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Add any additional meta tags or scripts needed */}
        </Head>
        <body>
          <Main />
          <NextScript />
          {/* Add a script to handle SPA routing for GitHub Pages */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Single Page Apps for GitHub Pages
                  // MIT License
                  // https://github.com/rafgraph/spa-github-pages
                  var segmentCount = 1;
                  var l = window.location;
                  if (l.search) {
                    var q = {};
                    l.search.slice(1).split('&').forEach(function(v) {
                      var a = v.split('=');
                      q[a[0]] = a.slice(1).join('=').replace(/~and~/g, '&');
                    });
                    if (q.p !== undefined) {
                      window.history.replaceState(null, null,
                        (q.p || '') +
                        (q.q ? ('?' + q.q) : '') +
                        l.hash
                      );
                    }
                  }
                })();
              `,
            }}
          />
        </body>
      </Html>
    )
  }
}

export default MyDocument