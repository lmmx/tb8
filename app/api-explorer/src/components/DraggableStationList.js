import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DraggableStationList = ({ stations, onReorder }) => {
  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(stations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="stations">
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef} className="mt-4 bg-white p-4 rounded-lg shadow-inner">
            {stations.map((station, index) => (
              <Draggable key={station.value} draggableId={station.value} index={index}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-2 p-2 bg-gray-100 rounded flex items-center"
                  >
                    <span className="mr-2">≡</span> {station.label}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableStationList;
