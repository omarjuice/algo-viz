import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

type childType = 'child' | 'children'
type item = { key: string } & Viz.order
type Props = {
    items: item[]
    changeType: (key: string, type: childType) => void
    removeKey: (key: string) => void
}


const reorder = (list: item[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const grid = 8;

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
    state: {
        items: item[]
    } = {
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

        this.setState({
            items
        });
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
                                                <div className="select">
                                                    <select onChange={(e) => this.props.changeType(item.key, e.target.value as childType)}
                                                        value={item.isMultiple ? "children" : 'child'}>
                                                        <option value={'child'}>child</option>
                                                        <option value={'children'}>children</option>
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