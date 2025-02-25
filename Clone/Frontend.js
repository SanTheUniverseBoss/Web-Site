import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Button } from "@/components/ui/button";

const CanvasEditor = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    newCanvas.selection = true;

    newCanvas.on("selection:created", (event) => {
      setSelectedObject(event.selected[0]);
    });

    newCanvas.on("selection:updated", (event) => {
      setSelectedObject(event.selected[0]);
    });

    setCanvas(newCanvas);

    return () => {
      newCanvas.dispose();
    };
  }, []);

  const addRectangle = () => {
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: "red",
      width: 100,
      height: 100,
      selectable: true,
    });
    canvas.add(rect);
  };

  const addCircle = () => {
    const circle = new fabric.Circle({
      left: 200,
      top: 150,
      fill: "blue",
      radius: 50,
      selectable: true,
    });
    canvas.add(circle);
  };

  const addText = () => {
    const text = new fabric.Text("Hello, World!", {
      left: 250,
      top: 200,
      fontSize: 20,
      fill: "black",
      selectable: true,
      fontFamily: "Arial"
    });
    canvas.add(text);
  };

  const deleteObject = () => {
    if (selectedObject) {
      canvas.remove(selectedObject);
      setSelectedObject(null);
    }
  };

  const changeColor = (color) => {
    if (selectedObject) {
      selectedObject.set("fill", color);
      canvas.renderAll();
    }
  };

  const changeFontSize = (size) => {
    if (selectedObject && selectedObject.type === "text") {
      selectedObject.set("fontSize", size);
      canvas.renderAll();
    }
  };

  const changeFontFamily = (font) => {
    if (selectedObject && selectedObject.type === "text") {
      selectedObject.set("fontFamily", font);
      canvas.renderAll();
    }
  };

  const bringForward = () => {
    if (selectedObject) {
      canvas.bringForward(selectedObject);
      canvas.renderAll();
    }
  };

  const sendBackward = () => {
    if (selectedObject) {
      canvas.sendBackwards(selectedObject);
      canvas.renderAll();
    }
  };

  const exportCanvas = () => {
    const dataURL = canvas.toDataURL({ format: "png" });
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas-export.png";
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="border border-gray-300" />
      <div className="flex gap-2">
        <Button onClick={addRectangle}>Add Rectangle</Button>
        <Button onClick={addCircle}>Add Circle</Button>
        <Button onClick={addText}>Add Text</Button>
        <Button onClick={deleteObject} disabled={!selectedObject}>
          Delete
        </Button>
      </div>
      <div className="flex gap-2 mt-4">
        <input type="color" onChange={(e) => changeColor(e.target.value)} />
        <input
          type="number"
          min="10"
          max="100"
          placeholder="Font Size"
          onChange={(e) => changeFontSize(Number(e.target.value))}
        />
        <select onChange={(e) => changeFontFamily(e.target.value)}>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={bringForward} disabled={!selectedObject}>Bring Forward</Button>
        <Button onClick={sendBackward} disabled={!selectedObject}>Send Backward</Button>
      </div>
      <div className="mt-4">
        <Button onClick={exportCanvas}>Export as PNG</Button>
      </div>
    </div>
  );
};

export default CanvasEditor;
