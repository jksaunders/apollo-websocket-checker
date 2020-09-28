import fetch from 'cross-fetch';
import { argv } from 'yargs';
import * as ws from 'ws';
import {
  ApolloClient,
  ApolloLink,
  gql,
  HttpLink,
} from '@apollo/client';
import { InMemoryCache } from '@apollo/client/cache';
import { WebSocketLink } from '@apollo/client/link/ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';

if (!argv.wsEndpoint) {
  console.error('missing `wsEndpoint` argument');
}
if (!argv.httpEndpoint) {
  console.error('missing `httpEndpoint` argument');
}
if (!argv.query && !argv.mutation) {
  console.log('no `query` or `mutation` argument specified')
  process.exit(1);
}

const wsClient = new SubscriptionClient(
  argv.wsEndpoint,
  {
    lazy: true,
    reconnect: true,
  },
  ws,
  []
);

const splitLink = ApolloLink.split(
  (operation) => {
    return false;
  },
  new WebSocketLink(wsClient),
  new HttpLink({
    fetch,
    uri: argv.httpEndpoint,
  })
);

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([splitLink]),
});

const runTest = async () => {
  if (argv.query) {
    console.log('Start query test');
    try {
      const result = await apolloClient.query({
        query: gql`${argv.query}`,
      });
      console.log('Apollo query success', JSON.stringify(result));
    } catch (error) {
      throw error;
      console.log('Apollo query error', JSON.stringify(error));
      process.exit(1);
    }
  }

  if (argv.mutation) {
    console.log('Start mutation test');
    try {
      const result = await apolloClient.mutate({
        mutation: gql`${argv.mutation}`,
      });
      console.log('Apollo mutation success', JSON.stringify(result));
    } catch (error) {
      console.log('Apollo mutation error', JSON.stringify(error));
      process.exit(1);
    }
  }
};

runTest().then(() => {
  runTest().then(() => {
    process.exit();
  });
});