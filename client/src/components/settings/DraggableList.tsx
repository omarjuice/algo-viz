import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

type childType = 'single' | 'multiple'
type item = { key: string } & Viz.order
type Props = {
    items: item[]
    changeType: (key: string, type: childType) => void
    removeKey: (key: string) => void
    updatePositions: (names: string[]) => void
}

type State = {
    items: item[]
}
const reorder = (list: item[], startIndex: number, endIndex: number) => {
    const result = [...list];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};


const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
    userSelect: "none",
    background: isDragging ? "lightgreen" : "grey",
    ...draggableStyle
});

const getListStyle = (isDraggingOver: boolean) => ({
    background: isDraggingOver ? "lightblue" : "lightgrey",
    marginTop: '1rem'
});

class DraggableList extends React.Component<Props> {
    state: State = {
        items: this.props.items
    };
    componentDidUpdate(prev: Props) {
        if (prev.items !== this.props.items) {
            this.setState({
                items: this.props.items
            })
        }
    }
    onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }
        const items = reorder(
            this.state.items,
            result.source.index,
            result.destination.index
        );
        this.props.updatePositions(items.map(item => item.key))
    }

    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            className="list"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {this.state.items.map((item, index) => (
                                <Draggable key={item.key} draggableId={item.key} index={index}>
                                    {(provided, snapshot) => (
                                        < div ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )} className="columns is-paddingless draggable-item list-item has-background-gray">
                                            <div className="column is-paddingless">
                                                <div className="select is-small">
                                                    <select onChange={(e) => this.props.changeType(item.key, e.target.value as childType)}
                                                        value={item.isMultiple ? 'multiple' : 'single'}>
                                                        <option value={'single'}>single</option>
                                                        <option value={'multiple'}>multiple</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="column is-paddingless has-text-white has-text-centered">
                                                {item.key}
                                            </div>
                                            <div className="column is-paddingless has-text-white has-text-centered">
                                                {index + 1}
                                            </div>
                                            <div className="column is-paddingless has-text-right">
                                                <button className="delete" onClick={() => this.props.removeKey(item.key)} />
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext >
        );
    }
}
export default DraggableList