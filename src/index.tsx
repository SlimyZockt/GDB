/* @refresh reload */
import { render } from 'solid-js/web'

import './styles.css'
import App from './App'
import { Overlays } from './Overlays'

render(() => <Overlays />, document.getElementsByTagName('html')[0])
render(() => <App />, document.getElementById('root') as HTMLElement)
