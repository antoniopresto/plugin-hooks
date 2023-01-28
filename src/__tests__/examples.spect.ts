import { createAsyncPlugin } from '../asyncPlugin';

describe('plugin-hooks', () => {
  test('async plugin', async () => {
    const SessionModel = {
      async findOne(sessionID: string): Promise<Session | undefined> {
        return { sessionID, user: { name: 'Antonio' } };
      },
    };

    interface Session {
      sessionID: string;
      user: { name: string; email?: string } | undefined;
    }

    interface Request {
      headers: { [K: string]: string | undefined };
      session: Session | undefined;
      userAgent?: string;
    }

    interface Response {
      send(body: string): void;
      redirect(url: string): void;
      next(error?: Error): void;
    }

    const response: Response = {
      send: jest.fn(),
      next: jest.fn(),
      redirect: jest.fn(),
    };

    const requestPlugin = createAsyncPlugin<Request, { response: Response }>();

    requestPlugin('loginMiddleware', async function loginMiddleware(request, { response }) {
      if (request.session?.user) return;
      const authToken = request.headers['authorization'];

      if (!authToken) {
        response.redirect('/login');
        throw new Error('Unauthorized');
      }
      const userSession = await SessionModel.findOne(authToken);

      if (!userSession) {
        response.redirect('/login');
        throw new Error('Unauthorized');
      }

      request.session = userSession;
      return request;
    });

    requestPlugin('userAgent', async function userAgent(request) {
      request.userAgent = request.headers['user-agent'];
      return request;
    });

    const user = await requestPlugin.dispatch(
      {
        headers: {
          'user-agent': 'NiceBrowser',
          authorization: 'XBVFGTY',
        },
        session: undefined,
      },
      {
        response,
      }
    );

    expect(response.redirect).not.toBeCalled();

    expect(user).toEqual({
      headers: {
        authorization: 'XBVFGTY',
        'user-agent': 'NiceBrowser',
      },
      session: {
        sessionID: 'XBVFGTY',
        user: {
          name: 'Antonio',
        },
      },
      userAgent: 'NiceBrowser',
    });
  });
});
