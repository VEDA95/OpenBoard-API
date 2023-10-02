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

    it('Testing successful hello world POST request.', (done: Mocha.Done): void => {
        request('http://localhost:3030/api')
            .post('/')
            .type('json')
            .send({name: 'Fry'})
            .end((err: any, response: ChaiHttp.Response): void => {
                assert.equal(response.text, 'Hello, Fry!');
                done();
            });
    });

    it('Testing hello world POST request input validation error handling.', (done: Mocha.Done): void => {
        request('http://localhost:3030/api')
            .post('/')
            .type('json')
            .send({name: ''})
            .end((err: any, response: ChaiHttp.Response): void => {
                assert.deepEqual(JSON.parse(response.text), {code: 400, error: 'the name cannot be empty...'});
                done();
            });
    });

    it('Testing hello world POST request input validation error handling (part 2).', (done: Mocha.Done): void => {
        request('http://localhost:3030/api')
            .post('/')
            .type('json')
            .send({})
            .end((err: any, response: ChaiHttp.Response): void => {
                assert.deepEqual(JSON.parse(response.text), {code: 400, error: 'must have required property \'name\''});
                done();
            });
    });
});