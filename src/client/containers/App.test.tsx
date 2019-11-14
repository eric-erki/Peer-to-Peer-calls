jest.mock('../actions/CallActions')
jest.mock('../socket')
jest.mock('../window')

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import { AnyAction, applyMiddleware, createStore } from 'redux'
import { init } from '../actions/CallActions'
import { Alert } from '../actions/NotifyActions'
import * as constants from '../constants'
import reducers from '../reducers'
import { middlewares, State, Store } from '../store'
import { MediaStream } from '../window'
import App from './App'

describe('App', () => {

  const initAction = { type: 'INIT' }

  let store: Store
  let state: Partial<State>
  let dispatchSpy: jest.SpyInstance<AnyAction, AnyAction[]>
  beforeEach(() => {
    state = {};
    (init as jest.Mock).mockReturnValue(initAction)

    window.HTMLMediaElement.prototype.play = jest.fn()
  })

  afterEach(() => {
    if (dispatchSpy) {
      dispatchSpy.mockReset()
      dispatchSpy.mockRestore()
    }
  })

  let node: Element
  async function render () {
    store = createStore(
      reducers,
      state,
      applyMiddleware(...middlewares),
    )
    dispatchSpy = jest.spyOn(store, 'dispatch')
    const div = document.createElement('div')
    node = await new Promise<HTMLDivElement>(resolve => {
      ReactDOM.render(
        <Provider store={store}>
          <div ref={div => resolve(div!)}>
            <App />
          </div>
        </Provider>,
        div,
      )
    })
  }

  describe('render', () => {
    it('renders without issues', async () => {
      await render()
      expect(node).toBeTruthy()
      expect((init as jest.Mock).mock.calls.length).toBe(1)
    })
  })

  describe('state', () => {
    let alert: Alert
    beforeEach(async () => {
      state.streams = {
        test: {
          mediaStream: new MediaStream(),
          url: 'blob://',
        },
      }
      state.peers = {
        test: {} as any,
      }
      state.notifications = {
        'notification1': {
          id: 'notification1',
          message: 'test',
          type: 'warning',
        },
      }
      alert = {
        dismissable: true,
        action: 'Dismiss',
        message: 'test alert',
        type: 'info',
      }
      state.alerts = [alert]
      await render()
    })

    describe('alerts', () => {
      it('can be dismissed', () => {
        const dismiss = node.querySelector('.action-alert-dismiss')!
        dispatchSpy.mockReset()
        TestUtils.Simulate.click(dismiss)
        expect(dispatchSpy.mock.calls).toEqual([[{
          type: constants.ALERT_DISMISS,
          payload: alert,
        }]])
      })
    })

    describe('video', () => {
      it('can be activated', () => {
        dispatchSpy.mockReset()
        const video = node.querySelector('video')!
        TestUtils.Simulate.click(video)
        expect(dispatchSpy.mock.calls).toEqual([[{
          type: constants.ACTIVE_TOGGLE,
          payload: { userId: constants.ME },
        }]])
      })
    })

  })

})