import {App} from './app'

const main = async () => {

const app =new App(4000);
await app.listen();
}

main()