import React, { PureComponent } from 'react'
import { AnimatedView } from '../../components'

export class About extends PureComponent {

  render() {
    return(      
      <AnimatedView>
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>About Longmire</h1>
              <p><strong>Congratulations!</strong> Welcome to the <span className="dog">Longmire Ratings Agency</span> smart contract.</p>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">
            Current Shares Listed
            </div>
            <div className="panel-body">
              <div>Blah-blah, all about us</div>
            </div>
          </div>
        </main>
      </AnimatedView>
    )
  }
}




export default About
