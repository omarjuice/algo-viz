import React, { Component } from 'react';
import store from '../store'
import { observer } from 'mobx-react';

import FastArrow from './icons/FastArrow';
import SlowArrow from './icons/SlowArrow';
import ValDisplay from './compose_components/ValDisplay';
import SwitchButton from './settings/SwitchButton';

// -Submitting code
// -Visualizing: playing and pausing
// -Visualizing: next and prev,fast and slow
// -Visualizing: type speeds
// -customizing
// -data structures: overview
// -data structures: children, single vs multiple
// -ds numChildren
// -data-structures: pointers
// -ds: displaykey
// -variable hiding
// -builtins
// -bug reporting






@observer
class Tutorial extends Component {
    imageUrl = (name: string) => `https://res.cloudinary.com/omarjuice/image/upload/v1566858014/algo-viz-tutorial/${name}.png`;
    titles = [
        'Getting Started',
        'Submitting code',
        'Visualizing: Playing and Pausing',
        'Visualizing: Stepping and Adjusting the Speed',
        'Visualizing: Type Specific Speeds',
        'Customization',
        'Data Structures: Overview',
        'Data Structures: Children and Child Ordering',
        'Data Structures: Single vs Multiple Children',
        'Data Structures: Number of Children',
        'Data Structures: Pointers',
        'Secret #1',
        'Secret #2',
        'Gotchas',
        'Bug Reporting'
    ]
    tutorialCompenents: React.ReactNode[] = [
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    Table of Contents
                </h1>
                {
                    this.titles.map((title, i) => {
                        return (
                            <div key={i}>
                                <button  onClick={() => this.setState({ index: i + 1 })}
                                    className="button is-text has-text-weight-bold">
                                    <ValDisplay color={store.settings.configColors['Step Slider Track']} size={25} anim={[false, false]} textDisplay={String(i + 1)} highlight={false} objectId={String(i)} /> {title}
                                </button>
                            </div>
                        )
                    })
                }
            </div>
        ),(
            <div>
            <h1 className="title is-4 has-text-centered">
                {this.titles[0]}
            </h1>
            <figure className="image is-16by9">
                <img src={this.imageUrl('nthFib')} alt="" />
            </figure>
            <br />
            <p >
               Algo-viz currently has language support for JavaScript. Support for Python will be coming in the near future.
               <br/>
                You will have the best experience using the <b>latest</b> versions of Chrome, Firefox, or Safari.
            </p>
        </div>
        )
        ,
        (<div>
            <h1 className="title is-4 has-text-centered">
                {this.titles[1]}
            </h1>
            <figure className="image is-16by9">
                <img src={this.imageUrl('coding')} alt="" />
            </figure>
            <br />
            <p >
                To start coding, hit the {' '}
                <button className="button is-small">
                    <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                        <img src={process.env.PUBLIC_URL + '/baseline-code-24px.svg'} alt="" />
                    </figure>
                </button>.
                {' '}
                You can write code in the built in editor and hit
                {' '} <button className={`button is-primary is-small`}>Run{' '}</button>{' '}
                to execute it.
            </p>
        </div>),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[2]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('playing')} alt="" />
                </figure>
                <br />
                <p >
                    You can play/pause the visualization by pressing the
                    {' '}
                    <button className="button is-small">
                        {<figure style={{ marginTop: '-3px' }} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/baseline-play_arrow-24px.svg'} alt="" />
                        </figure>}
                    </button>
                    {' '}
                    or by hitting the space bar on your keyboard.
                </p>
            </div>
        ),

        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[3]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('playing2')} alt="" />
                </figure>
                <p>
                    When the visualization is paused, you can step through your code by pressing the
                    {' '}
                    <button className="button is-small" >
                        <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/baseline-skip_next-24px.svg'} alt="" />
                        </figure>
                    </button>
                    {' '}or{' '}
                    <button className="button is-small" >
                        <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/baseline-skip_previous-24px.svg'} alt="" />
                        </figure>
                    </button>
                    {' '}
                    buttons or by pressing the left or right arrow keys on your keyboard.
                    <br />
                    When the visualization is playing, you can speed it up or slow it down by pressing the
                    {' '}
                    <button className="button is-small">
                        <FastArrow />
                    </button>
                    {' '} or {' '}
                    <button className="button is-small">
                        <SlowArrow />
                    </button>
                    {' '}
                    respectively.
                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[4]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('speeds')} alt="" />
                </figure>
                <p>
                    You can also adjust the speeds for individual step types.
                    For example, if you want it to visualize only variable assignments at a slower speed, you would adjust the
                    {' '}
                    <b>ASSIGNMENT</b> type.
                    {' '}
                    
                        The slider represents how much time a particular type will execute for. So increasing the value (sliding to the right) will make
                        it execute{' '} <b>slower</b>.
                    
                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[5]}
                </h1>
               <div style={{backgroundColor: store.settings.configColors["Background"]}}>
               {Object.keys(store.settings.config).map((name) => {
                    const n = name as Viz.configTypes
                    return (
                        <div key={name}>
                            <div className="columns">
                                <div className="column has-text-white">
                                    {name}
                                </div>
                                <div className="column">
                                    <SwitchButton onClick={() => {}} size={50} toggled={store.settings.config[n]} />
                                </div>
                            </div>
                        </div>
                    )
                })}
               </div>
               <br/>
                <p>
                    You have a high degree of customization available to you.
                    <br />
                    <span className="has-text-weight-bold">
                        Layout:
                    </span>
                    {' '}
                    The first {' '} <b>five</b> fields here are layout elements that you can turn on and off.
                    You might want a lot of space for visualizing objects, for example. In that case you would toggle the other layout panels off.
                    <br />
                    <span className="has-text-weight-bold">
                        tooltips:
                    </span>
                    {' '}
                    When enabled, if a GET or SET is performed on an object value, a tooltip will appear over the value showing its actual value.
                        This is always available by hovering over the value.
                    <br />
                    <span className="has-text-weight-bold">
                        Active Pointer on GET:
                    </span>
                    {' '}
                    Doesn't that just roll off the tongue? When enabled, the visualizer will put objects on the screen that are retrieved from other objects by your code, if they are not already on the screen.
                    This is always available by hovering over that object's pointer as well.
                    <br />
                    <span className="has-text-weight-bold">
                        Scroll Objects Into View:
                    </span>
                    {' '}
                    When enabled, if an element in an object is not visible, when a GET or SET is performed on that element, it will be scrolled into view.
                    <br />
                    <span className="has-text-weight-bold">
                        Find Object Parents:
                    </span>
                    {' '}
                    Normally, an object will only find its parent if its parent has an active variable binding. With this enabled, it will find its parent regardless. 
                    <br />
                    <span className="has-text-weight-bold">
                        Colors:
                    </span>
                    {' '}
                    The Colors panel (to the left of the Config panel), allows you to configure the colors of various things on the screen.
                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[6]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('structs')} alt="" />
                </figure>
                <p>
                    Anything that is not the language's builtin Array type or Hash type (for JS that includes Object, Map, and Set)
                    will be treated as a Data Structure. That means that to visualize a particular data structure, you will want to create it from a
                    class constructor in your code.
                    <br />
                    To customize the rendering of a Structure, visit the <b>Struct Settings</b> panel in settings.
                    First of all, you can choose what property of that structure to display by specifying its <b>Display Key</b>.
                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[7]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('children')} alt="" />
                </figure>
                <p>
                    You must declare which keys of the object contain children. <b>Children</b> can be any object (Arrays, Hash-like structs, other data structures).
                    In the <b>Struct Settings</b> panel in settings, when you add children, you will notice that you can drag them around to customize the order. 
                    When a structure renders, it will use this order to determine where to put which child.
                    That is how it knows that a Binary Tree's 'left' child is actually to its left.
                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[8]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('multi_children')} alt="" />
                </figure>
                <p>
                    You can also have a structure with multiple children through one of its children. In the above example,
                    the <b>Tree</b> class only has one child object, an Array. However, when specifying child keys, you can tell the structure that it has indirect children
                    in another object by giving it the <b>multiple</b> flag. In JS, this will work for Arrays, Objects, and Maps.
                    Without the multiple flag, the object will render as if it itself was the child of that structure.
                    <br />
                    For Arrays, the children are ordered by their numerical indices.
                    For Objects and Maps, the children are ordered lexicographically by key.

                </p>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[9]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('numChildren')} alt="" />
                </figure>
                <p>
                    In <b>Struct Settings</b> you can specify the exact <b>number of children</b> a structure will have. In above example, the <b>MyBTree</b>
                    {' '}
                    class is a binary tree, but when it has only one child it does not look like such. Thats because all structures
                    default to having an <b>unspecified</b> number of children. We can fix that by specifying
                    the number of children to be 2:
                </p>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('numChildren2')} alt="" />
                </figure>
                <p>
                    Much better. Now the structure looks more obviously like a binary tree.
                    When the number of children is set to exactly one, it will render horizontally from left to right.
                    Ideal for Linked Lists and similar structures.
                </p>
               
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[10]}
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('pointers')} alt="" />
                </figure>
                <div>
                    You might not always want to link structures to each other as children. In that case, you may want to specify
                    a particular key as a <b>pointer</b>. Take, for example, the <b>prev</b> pointer on the above Doubly Linked List.
                     The key difference between pointers and children are as follows:
                    <ul>
                        <li> <b>1.</b> A parent will find its children and render them with it. A parent will not find its pointers.</li>
                        <li> <b>2.</b> A pointer will not render until the object it is pointing to is on the screen.</li>
                        <li> <b>3.</b> A parent can only have <b>one</b> child reference to a particular object. All other references to that object declared as child
                        references will be treated as pointers.</li>
                        <li> <b>4.</b> Similarly, a child can only have one parent. All other references to it will be pointers. 
                        Which parent gets which child is determined by a heap-based algorithm that takes into account which reference occurred first and the types of the 
                        parent and the child.</li>
                        <li> <b>5.</b> A structure can have any number of pointers to a particular object.</li>
                        <li> <b>6.</b> Children are indicated by straight lines. Pointers will always be arcs. </li>


                    </ul>
                </div>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    Secret #1: Variable Hiding
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('var_hiding')} alt="" />
                </figure>
                <div>
                    Any object that is referenced by a variable accessible in the currently executing scope will be rendered on the screen.
                    This can be undesirable at times. You can totally hide a variable from being visualized by prefixing it with an underscore.
                    Also, object properties that are _prefixed will not be shown or tracked at all.
                </div>
            </div>
        ), (
            <div>
                <h1 className="title is-4 has-text-centered">
                    Secret #2: Builtins
                </h1>
                <figure className="image is-16by9">
                    <img src={this.imageUrl('builtins')} alt="" />
                </figure>
                <div>
                    There are various <b>builtin</b> data structures. Their rendering details are taken care of for you, although you can still change the colors.
                    As I figure out how to make the editor's auto-complete work with the type definitions of the builtins,
                    please refer to this file for documentation:
                    <br />
                    <a className="has-text-weight-bold" href="https://github.com/omarjuice/algo-viz/blob/master/builtins/js/types.d.ts" target="_blank" rel="noopener noreferrer">
                        Builtin Type Definitions
                    </a>
                </div>
            </div>
        ), (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[13]}
                </h1>

                <div>
                   Here are some things to be aware of:
                    <br/>
                   1. <b>Typed Arrays</b> are not supported.
                   <br/>
                   2. <b>Getters and setters</b> will be invoked from outside of your code 
                   <br/>
                   3. <b>Generator functions</b> are experimentally supported.
                    To be specific, if your code executes <b>two or more</b> instances of the same generator at the same time,
                    it cannot be guaranteed that the values displayed will be accurate. However, recursive calls to the same generator will work just fine.
                    <br/>
                    4. <b>Asynchronous APIs</b> (setImmediate, setTimeout, etc.) are unavailable.
                    <br/>
                    5. <b>Class extension</b> is not currently supported but will be in the future.
                </div>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    {this.titles[14]}
                </h1>

                <div>
                    Hit the
                    {' '}
                    <button className="button is-danger is-small">
                        <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/bug-24px.svg'} alt="" />
                        </figure>
                    </button>
                    {' '}
                    to report a bug. Write a description of the issue and preferably the steps to recreate it as well.
                    A copy of the code currently being visualized will be sent along with your report.
                </div>
            </div>
        ),
        (
            <div>
                <h1 className="title is-4 has-text-centered">
                    Enjoy!
                </h1>

                <div>
                    I hope that Algo-viz helps you in some way. If, not please let me know how it can be improved.
                    This project is totally open source.
                    You can find the source code here:
                </div>
                <div className="columns is-centered">
                    <div className="column is-narrow">
                        <a href="https://github.com/omarjuice/algo-viz" target="_blank" rel="noopener noreferrer">
                            <figure className="image is-64x64">
                                <img src={process.env.PUBLIC_URL + '/github-brands.svg'} alt="" />
                            </figure>
                        </a>
                    </div>
                </div>
            </div>
        )



    ]
    state = {
        index: 0
    }
    onClick = (change: -1 | 1) => {
        this.setState({
            index: this.state.index + change
        })
    }
    render() {

        return (
            <div className={`modal ${store.tutorial && 'is-active'}`}>
                <div className="modal-background" onClick={() => store.stopTutorial()} />
                <div  className="modal-card" style={{ backgroundColor: '#111111', height: '90vh' }}>
                    <header style={{ backgroundColor: store.settings.configColors['Navbar'] }} className="modal-card-head">
                        <p className="modal-card-title">Tutorial</p>
                        <button onClick={() => store.stopTutorial()} className="delete" aria-label="close"></button>
                    </header>
                    <section className="modal-card-body has-text-dark has-background-light">
                        {this.state.index ? (
                            <p className="is-size-6">
                                <button
                                    onClick={() => this.setState({ index: 0 })}
                                    className="button is-small is-text">
                                    Back to Table of Contents
                                </button>
                            </p>
                        ) : null}
                        {this.tutorialCompenents[this.state.index]}
                    </section>
                    <footer className="modal-card-foot" style={{
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                           <div className="buttons has-addons is-centered">
                            <button
                                onClick={() => this.onClick(-1)}
                                disabled={this.state.index <= 0} className="button">
                                <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                            <img src={process.env.PUBLIC_URL + '/baseline-skip_previous-24px.svg'} alt="" />
                        </figure>
                            </button>
                            <button
                                onClick={() => this.onClick(1)}
                                disabled={this.state.index === this.tutorialCompenents.length - 1} className="button">
                                 <figure style={{ marginTop: '-3px' }} className="image is-4by4">
                                    <img src={process.env.PUBLIC_URL + '/baseline-skip_next-24px.svg'} alt="" />
                                </figure>
                            </button>
                        </div>
                     
                    </footer>

                </div>
            </div>
        );
    }
}

export default Tutorial;
