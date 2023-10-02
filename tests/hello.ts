import { assert, use, request } from 'chai';
import chaiHttp from 'chai-http';


use(chaiHttp);

describe('/ route', (): void => {
    it('Testing hello world GET request.', (done: Mocha.Done): void => {
        request('http://localhost:3030/api')
            .get('/')
            .end((err: any, response: ChaiHttp.Response): void => {
                assert.equal(response.text, 'Hello World!');
                done();
            });
    });
});