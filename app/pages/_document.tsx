import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.intercomSettings = {
                api_base: "https://api-iam.intercom.io",
                app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID
              };
              (function() {
                var w = window;
                var ic = w.Intercom;
                if (typeof ic === "function") {
                  ic('reattach_activator');
                  ic('update', w.intercomSettings);
                } else {
                  var d = document;
                  var i = function() {
                    i.c(arguments);
                  };
                  i.q = [];
                  i.c = function(args) {
                    i.q.push(args);
                  };
                  w.Intercom = i;
                  var l = function() {
                    var s = d.createElement('script');
                    s.type = 'text/javascript';
                    s.async = true;
                    s.src = 'https://widget.intercom.io/widget/' + window.intercomSettings.app_id;
                    var x = d.getElementsByTagName('script')[0];
                    x.parentNode.insertBefore(s, x);
                  };
                  if (document.readyState === 'complete') {
                    l();
                  } else if (w.attachEvent) {
                    w.attachEvent('onload', l);
                  } else {
                    w.addEventListener('load', l, false);
                  }
                }
              })();
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;