import { assert, use, request } from 'chai';
import chaiHttp from 'chai-http';

use(chaiHttp);

describe('/ route', (): void => {
    it('Testing hello world GET request.', (done): void => {
        request('http://localhost:3030')
            .get('/')
            .end((err, response): void => {
                assert.equal(response.text, 'Hello World!');
                done();
            });
    });
});