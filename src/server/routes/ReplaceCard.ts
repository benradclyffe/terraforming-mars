import * as responses from '../server/responses';
import {IPlayer} from '../IPlayer';
import {Server} from '../models/ServerModel';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {isPlayerId} from '../../common/Types';
import {CardName} from '../../common/cards/CardName';
import {Request} from '../Request';
import {Response} from '../Response';
import {runId} from '../utils/server-ids';
import {AppError} from '../server/AppError';
import {statusCode} from '../../common/http/statusCode';
import {InputError} from '../inputs/InputError';
import {Database} from '../database/Database';
import {AppErrorResponse, INVALID_RUN_ID} from '../../common/app/AppErrorId';

type ReplaceCardBody = {
  runId?: string;
  targetCardName: CardName;
  replacementCardName: CardName;
};

// Sandbox route: swap a currently-offered card for a named card from the deck.
// See Player.replaceDealtCard. The client gates this behind a preference.
export class ReplaceCard extends Handler {
  public static readonly INSTANCE = new ReplaceCard();

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.url.searchParams.get('id');
    if (playerId === null || !isPlayerId(playerId)) {
      responses.badRequest(req, res, 'invalid player id');
      return;
    }

    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      responses.notFound(req, res);
      return;
    }
    let player: IPlayer | undefined;
    try {
      player = game.getPlayerById(playerId);
    } catch (err) {
      console.warn(`unable to find player ${playerId}`, err);
    }
    if (player === undefined) {
      responses.notFound(req, res);
      return;
    }

    const definedPlayer = player;
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (data) => {
        body += data.toString();
      });
      req.once('end', async () => {
        try {
          const entity = JSON.parse(body) as ReplaceCardBody;
          validateRunId(entity);
          definedPlayer.replaceDealtCard(entity.targetCardName, entity.replacementCardName);
          await Database.getInstance().saveGame(definedPlayer.game);
          responses.writeJson(res, ctx, Server.getPlayerModel(definedPlayer));
          resolve();
        } catch (e) {
          if (!(e instanceof AppError || e instanceof InputError)) {
            console.warn('Error replacing card', e);
          }
          res.writeHead(statusCode.badRequest, {'Content-Type': 'application/json'});
          const id = e instanceof AppError ? e.id : undefined;
          const message = e instanceof Error ? e.message : String(e);
          const response: AppErrorResponse = {id, message};
          res.write(JSON.stringify(response));
          res.end();
          resolve();
        }
      });
    });
  }
}

function validateRunId(entity: ReplaceCardBody) {
  if (entity.runId !== undefined && runId !== undefined && entity.runId !== runId) {
    throw new AppError(INVALID_RUN_ID, 'The server has restarted. Click OK to refresh this page.');
  }
}
