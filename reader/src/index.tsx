import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from "@self.id/framework";
import {ModelTypesToAliases} from "@glazed/types";
import {ModelTypes} from "./ScoreResultView";


const aliasesJson = {
  definitions: {
    Passport: 'kjzl6cwe1jw14b5pv8zucigpz0sc2lh9z5l0ztdrvqw5y1xt2tvz8cjt34bkub9',
    VerifiableCredential:
      'kjzl6cwe1jw147bsnnxvupgywgr0tyi7tesgle7e4427hw2dn8sp9dnsltvey1n',
  },
  schemas: {
    Passport:
      'ceramic://k3y52l7qbv1frygm3lu9o9qra3nid11t6vuj0mas2m1mmlywh0fop5tgrxf060000',
    VerifiableCredential:
      'ceramic://k3y52l7qbv1frxunk7h39a05iup0s5sheycsgi8ozxme1s3tl37modhalv38d05q8',
  },
  tiles: {},
}

const aliases: ModelTypesToAliases<ModelTypes> = aliasesJson
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider client={{ ceramic: 'testnet-clay', aliases }}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
