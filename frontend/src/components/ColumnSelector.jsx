import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

function ColumnSelector({ allColumns, selectedColumns, onChange }) {
  const handleToggle = (key) => {
    if (selectedColumns.includes(key)) {
      onChange(selectedColumns.filter(k => k !== key))
    } else {
      onChange([...selectedColumns, key])
    }
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(selectedColumns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onChange(items)
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div className="column-selector">
        {allColumns.map((col) => (
          <label key={col.key}>
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.key)}
              onChange={() => handleToggle(col.key)}
            />
            {col.label}
          </label>
        ))}
      </div>

      {selectedColumns.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
            Reihenfolge per Drag & Drop anpassen:
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}
                >
                  {selectedColumns.map((key, index) => {
                    const col = allColumns.find(c => c.key === key)
                    return (
                      <Draggable key={key} draggableId={key} index={index}>
                        {(provided, snapshot) => (
                          <span
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="badge badge-info"
                            style={{
                              ...provided.draggableProps.style,
                              cursor: 'grab',
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                          >
                            {col?.label || key}
                          </span>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  )
}

export default ColumnSelector
