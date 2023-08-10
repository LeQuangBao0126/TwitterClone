import { Server } from 'socket.io'
import { UserVerifyStatus } from '../constants/enum'
import { ErrorWithStatus } from '../models/Error'
import HTTP_STATUS from '../constants/httpStatus'
import { verifyAccessToken } from './commons'
import { TokenPayload } from '~/models/requests/User.requests'

import { Server as HttpServerType } from 'http'
import databaseService from '~/services/database.services'
import Conversation from '~/models/schemas/Conversation.schemas'
import { ObjectId } from 'mongodb'

const usersSocket: any = {}

export const initialSocket = (httpServer: HttpServerType) => {
  const io = new Server(httpServer, { cors: { origin: '*' }, transports: ['websocket'] })
  //su dung middleware socket . xac minh ng dung
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization

    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      const { verify } = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        new ErrorWithStatus({ message: 'user is not verify', status: HTTP_STATUS.UNAUTHORIZED })
      }
      socket.handshake.auth.decoded_authorization = decoded_authorization
      socket.handshake.auth.access_token = access_token
      next()
      //nhay den middleware tiep socket
    } catch (err) {
      next({
        name: 'ERR_UNAUTHORIZED',
        message: 'unauthorized socket',
        data: err
      })
    }
  })

  //
  io.on('connection', (socket) => {
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    if (user_id) {
      usersSocket[user_id] = {
        socket_id: socket.id
      }
      // can be use redis
    }
    socket.use(async (event, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token) // neu verify ko dc thì cho ra error
        next()
      } catch (err) {
        next(new Error('Unauthorized'))
      }
    })
    socket.on('error', (err) => {
      if (err.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    socket.on('c_send_message', (data) => {
      if (!usersSocket[data.receiver_id]) {
        socket.emit('s_user_not_online', { content: 'User kia hien dang ko online' })
      } else {
        databaseService.conversations.insertOne(
          new Conversation({
            sender_id: new ObjectId(data.sender_id),
            receiver_id: new ObjectId(data.receiver_id),
            content: data.content
          })
        )
        socket.to(usersSocket[data.receiver_id].socket_id).emit('s_response_message', data)
      }
    })
    socket.on('disconnect', (socket) => {
      delete usersSocket[user_id]
      // log history ... v...v
      console.log('1 thiet bi vua dang thoat ')
    })
  })
}
