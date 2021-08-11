import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Landing from "./components/landing"
import Game from "./components/game"
import { About } from "./components/about"

const App: React.FC<{}> = () => (
    <Router>
        <Switch>
            <Route path="/about">
                <About />
            </Route>
            <Route path="/game" component={Game} />
            <Route path="/" component={Landing} />
        </Switch>
    </Router>
)

export default App
