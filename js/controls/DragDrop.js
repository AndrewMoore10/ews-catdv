var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var controls;
(function (controls) {
    var DropTarget = (function () {
        function DropTarget() {
        }
        return DropTarget;
    }());
    var DragManager = (function () {
        function DragManager() {
            var _this = this;
            // The current drag event state
            this.dragging = false;
            this.currentDragEvent = null;
            this.dragStartHandler = null;
            this.trackDragHandler = null;
            this.dropHandler = null;
            $(document).on("mousemove", function (evt) { return _this.onDocumenttMouseMove(evt); });
            $(document).on("mouseup", function (evt) { return _this.onDocumentMouseUp(evt); });
        }
        DragManager.prototype.onDragStart = function (dragStartHandler) {
            this.dragStartHandler = dragStartHandler;
        };
        DragManager.prototype.onTrackDrag = function (trackDragHandler) {
            this.trackDragHandler = trackDragHandler;
        };
        DragManager.prototype.onDrop = function (dropHandler) {
            this.dropHandler = dropHandler;
        };
        DragManager.prototype.registerDropTarget = function (dropTarget) {
            DragManager.dropTargets.push({ element: dropTarget, dragManager: this });
        };
        DragManager.prototype.$registerDragSource = function (jQuery) {
            this.registerDragSource(jQuery.get(0));
        };
        DragManager.prototype.registerDragSource = function (element) {
            var _this = this;
            // don't hold reference to element, as could cause leaks if it is removed from DOM - just attach events
            $(element).on("mousedown", function (evt) { return _this.onElementMouseDown(evt); });
            element.style.cursor = "default";
        };
        DragManager.prototype.onElementMouseDown = function (evt) {
            this.currentDragEvent = {
                sourceElement: evt.target,
                mouseDownX: evt.clientX,
                mouseDownY: evt.clientY,
                mouseX: evt.clientX,
                mouseY: evt.clientY,
                offsetX: evt.offsetX,
                offsetY: evt.offsetY
            };
        };
        DragManager.prototype.onDocumenttMouseMove = function (evt) {
            var mouseOverElement = evt.target;
            if (this.currentDragEvent != null) {
                this.currentDragEvent.mouseX = evt.clientX;
                this.currentDragEvent.mouseY = evt.clientY;
            }
            if (this.dragging) {
                // drag drag feedback
                this.currentDragEvent.visualDragElement.style.left = (evt.clientX - this.currentDragEvent.offsetX) + "px";
                this.currentDragEvent.visualDragElement.style.top = (evt.clientY - this.currentDragEvent.offsetY) + "px";
                var dropTarget = this.findDropTarget(evt);
                if (dropTarget) {
                    // Are we over a different target? If so notify the previous one that we've left
                    if (this.overTarget && this.overTarget.element !== dropTarget.element) {
                        this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                        this.overTarget = null;
                    }
                    dropTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, true);
                    this.overTarget = dropTarget;
                }
                else if (this.overTarget) {
                    this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                    this.overTarget = null;
                }
                evt.preventDefault();
                return false;
            }
            else if ((this.currentDragEvent != null) && (mouseOverElement === this.currentDragEvent.sourceElement)) {
                // only start the drag if the mouse has moved away from the initial mousedown location
                if ((this.currentDragEvent.mouseDownX != evt.clientX) || (this.currentDragEvent.mouseDownY != evt.clientY)) {
                    this.dragging = true;
                    if (this.dragStartHandler) {
                        this.dragStartHandler(this.currentDragEvent);
                    }
                    if (!this.currentDragEvent.visualDragElement) {
                        // Caller has not set a feedback element so create a default one by attempting to 'clone' the target
                        this.currentDragEvent.visualDragElement = document.createElement("div");
                        this.currentDragEvent.visualDragElement.innerText = this.currentDragEvent.sourceElement.innerText;
                        this.currentDragEvent.visualDragElement.style.width = this.currentDragEvent.sourceElement.clientWidth + "px";
                        this.currentDragEvent.visualDragElement.style.height = this.currentDragEvent.sourceElement.clientHeight + "px";
                        this.currentDragEvent.visualDragElement.style.cursor = "default";
                        var targetStyle = window.getComputedStyle(this.currentDragEvent.sourceElement);
                        this.currentDragEvent.visualDragElement.style.backgroundColor = targetStyle.backgroundColor;
                    }
                    document.body.appendChild(this.currentDragEvent.visualDragElement);
                    this.currentDragEvent.visualDragElement.style.position = "absolute";
                    this.currentDragEvent.visualDragElement.style.zIndex = "100000";
                    this.currentDragEvent.visualDragElement.style.left = (evt.clientX - this.currentDragEvent.offsetX) + "px";
                    this.currentDragEvent.visualDragElement.style.top = (evt.clientY - this.currentDragEvent.offsetY) + "px";
                }
                evt.preventDefault();
                return false;
            }
            else {
                return true;
            }
        };
        DragManager.prototype.onDocumentMouseUp = function (evt) {
            if (this.overTarget) {
                this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                this.overTarget = null;
            }
            if (this.dragging) {
                var dropTarget = this.findDropTarget(evt);
                if (dropTarget != null) {
                    dropTarget.dragManager.dispatchDropEvent(this.currentDragEvent);
                }
                document.body.removeChild(this.currentDragEvent.visualDragElement);
                this.currentDragEvent = null;
                this.dragging = false;
                evt.preventDefault();
                return false;
            }
            else {
                this.currentDragEvent = null;
                return true;
            }
        };
        DragManager.prototype.dispatchTrackDragEvent = function (dragEvent, overTarget) {
            if (this.trackDragHandler) {
                this.trackDragHandler(dragEvent, overTarget);
            }
        };
        DragManager.prototype.dispatchDropEvent = function (dragEvent) {
            if (this.dropHandler) {
                this.dropHandler(dragEvent);
            }
        };
        DragManager.prototype.findDropTarget = function (evt) {
            for (var i = 0; i < DragManager.dropTargets.length; i++) {
                var target = DragManager.dropTargets[i];
                var targetRect = target.element.getBoundingClientRect();
                if ((evt.clientX >= targetRect.left) && (evt.clientX <= targetRect.right) && (evt.clientY >= targetRect.top) && (evt.clientY <= targetRect.bottom)) {
                    return target;
                }
            }
            return null;
        };
        // List of registered drop targets - shared amongst all instaces of DragManager
        DragManager.dropTargets = [];
        return DragManager;
    }());
    controls.DragManager = DragManager;
    (function (Direction) {
        Direction[Direction["Horizontal"] = 1] = "Horizontal";
        Direction[Direction["Vertical"] = 2] = "Vertical";
    })(controls.Direction || (controls.Direction = {}));
    var Direction = controls.Direction;
    var DraggableElement = (function (_super) {
        __extends(DraggableElement, _super);
        function DraggableElement(element, direction, minPosition, maxPosition) {
            var _this = this;
            _super.call(this, element);
            this.gotMouseDown = false;
            this.dragging = false;
            this.disabled = false;
            this.ignoreClick = false;
            this.dragHandler = null;
            this.dropHandler = null;
            this.clickHandler = null;
            this.element = this.$element.get(0);
            this.direction = direction;
            this.setLimits(minPosition, maxPosition);
            this.$element.on("mousedown", function (evt) { return _this.handleMouseDown(evt); });
            this.mouseMoveHandler = function (evt) { return _this.handleMouseMove(evt); };
            this.mouseUpHandler = function (evt) { return _this.handleMouseUp(evt); };
            this.$element.click(function (evt) {
                controls.Console.debug("DraggableElement.click. ignoreClick:" + _this.ignoreClick);
                if (!_this.ignoreClick) {
                    if (_this.clickHandler)
                        _this.clickHandler(evt);
                }
                else {
                    _this.ignoreClick = false;
                    evt.stopPropagation();
                }
            });
        }
        // Override Element.onClick
        DraggableElement.prototype.onClick = function (clickHandler) {
            this.clickHandler = clickHandler;
        };
        DraggableElement.prototype.onDrag = function (dragHandler) {
            this.dragHandler = dragHandler;
        };
        DraggableElement.prototype.onDrop = function (dropHandler) {
            this.dropHandler = dropHandler;
        };
        DraggableElement.prototype.isDragging = function () {
            return this.dragging;
        };
        DraggableElement.prototype.setLimits = function (minPosition, maxPosition) {
            this.minPosition = minPosition;
            this.maxPosition = maxPosition - ((this.direction == Direction.Horizontal) ? this.getWidth() : this.getHeight());
            controls.Console.debug("drag limits minPosition:" + this.minPosition + ",maxPosition:" + this.maxPosition + ",width:" + this.getWidth());
            if (this.direction == Direction.Horizontal) {
                this.element.style.left = Math.min(this.maxPosition, Math.max(this.minPosition, this.$element.position().left)) + "px";
            }
            else {
                this.element.style.top = Math.min(this.maxPosition, Math.max(this.minPosition, this.$element.position().top)) + "px";
            }
        };
        DraggableElement.prototype.getLimits = function () {
            return { "min": this.minPosition, "max": this.maxPosition };
        };
        DraggableElement.prototype.setDisabled = function (disabled) {
            this.disabled = disabled;
            if (disabled) {
                this.$element.addClass("disabled");
            }
            else {
                this.$element.removeClass("disabled");
            }
        };
        DraggableElement.prototype.handleMouseDown = function (evt) {
            if (!this.disabled) {
                if (this.element.setCapture) {
                    // Firefox, IE
                    this.element.setCapture(false);
                    this.$element.on("mousemove", this.mouseMoveHandler);
                    this.$element.on("mouseup", this.mouseUpHandler);
                }
                else {
                    // Chrome doesn't support setCapture() so need to capture all mouse events
                    $(document).on("mousemove", this.mouseMoveHandler);
                    $(document).on("mouseup", this.mouseUpHandler);
                }
                this.startMouseX = evt.clientX;
                this.startMouseY = evt.clientY;
                this.startElementLeft = this.$element.position().left;
                this.startElementTop = this.$element.position().top;
                controls.Console.debug("mousedown clientX:" + evt.clientX + ",offsetX:" + evt.offsetX + ",elementX:" + this.startElementLeft + ",styleLeft:" + this.$element.css("left"));
                this.gotMouseDown = true;
                this.savedZIndex = this.$element.css("z-index");
                this.$element.css({ "z-index": 1000 });
            }
            evt.preventDefault();
            evt.cancelBubble = true;
            return false;
        };
        DraggableElement.prototype.handleMouseMove = function (evt) {
            if (!this.dragging && this.gotMouseDown && (evt.clientX != this.startMouseX || evt.clientY != this.startMouseY)) {
                // mouse has moved since mouse down - start drag
                this.dragging = true;
            }
            if (this.dragging && !this.disabled) {
                var position;
                if (this.direction == Direction.Horizontal) {
                    var deltaX = evt.clientX - this.startMouseX;
                    position = Math.min(this.maxPosition, Math.max(this.minPosition, this.startElementLeft + deltaX));
                    //                    Console.debug("mousemove clientX:" + evt.clientX + ",deltaX:" + deltaX + ",this.maxPosition:" + this.maxPosition + ",this.minPosition:" + this.minPosition + ", position:" + position);
                    this.element.style.left = position + "px";
                }
                else {
                    var deltaY = evt.clientY - this.startMouseY;
                    position = Math.min(this.maxPosition, Math.max(this.minPosition, this.startElementTop + deltaY));
                    this.element.style.top = position + "px";
                }
                if (this.dragHandler) {
                    this.dragHandler({ element: this.element, position: position });
                }
                evt.preventDefault();
                evt.cancelBubble = true;
                this.ignoreClick = true;
                return false;
            }
            else {
                return true;
            }
        };
        DraggableElement.prototype.handleMouseUp = function (evt) {
            this.gotMouseDown = false;
            if (this.dragging && !this.disabled) {
                this.dragging = false;
                this.css({ "z-index": this.savedZIndex });
                if (this.element.setCapture) {
                    // Firefox, IE
                    this.element.releaseCapture();
                    this.$element.off("mousemove", this.mouseMoveHandler);
                    this.$element.off("mouseup", this.mouseUpHandler);
                }
                else {
                    // Chrome doesn't support setCapture()
                    $(document).off("mousemove", this.mouseMoveHandler);
                    $(document).off("mouseup", this.mouseUpHandler);
                }
                if (this.dropHandler) {
                    this.dropHandler({ element: this.element, position: parseInt(this.element.style.left) });
                }
                evt.cancelBubble = true;
                evt.preventDefault();
                return false;
            }
            else {
                return true;
            }
        };
        return DraggableElement;
    }(controls.Element));
    controls.DraggableElement = DraggableElement;
    var HSplitter = (function (_super) {
        __extends(HSplitter, _super);
        function HSplitter(element, initialSplitPercentage) {
            var _this = this;
            if (initialSplitPercentage === void 0) { initialSplitPercentage = 50; }
            _super.call(this, element);
            this.splitterWidth = 6;
            this.css({
                "position": "absolute",
                "left": "0px",
                "right": "0px",
                "bottom": "0px",
                "top": "0px"
            });
            this.splitPosition = this.getWidth() * initialSplitPercentage / 100;
            this.leftPane = new controls.Element(this.$element.children(":nth-child(1)"));
            this.leftPane.css({
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "bottom": "0px",
                "width": this.splitPosition
            });
            $("<div class='splitter-handle horizontal'>").insertAfter(this.leftPane.$element);
            // Need to set the width of the splitter before creating the DraggableElement
            var $splitter = this.$element.children(":nth-child(2)");
            $splitter.css({
                "position": "absolute",
                "top": "0px",
                "left": this.splitPosition,
                "bottom": "0px",
                "width": "" + this.splitterWidth + "px",
                "-webkit-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "user-select": "none"
            });
            this.splitter = new DraggableElement($splitter, Direction.Horizontal, 0, this.getWidth());
            this.splitter.onDrag(function (evt) { return _this.splitter_onDrag(evt); });
            this.rightPane = new controls.Element(this.$element.children(":nth-child(3)"));
            this.rightPane.css({
                "position": "absolute",
                "top": "0px",
                "left": this.splitPosition + this.splitterWidth,
                "bottom": "0px",
                "right": "0px"
            });
        }
        HSplitter.prototype.splitter_onDrag = function (evt) {
            this.splitPosition = evt.position;
            this.leftPane.css({ "width": this.splitPosition });
            this.rightPane.css({ "left": this.splitPosition + this.splitterWidth });
        };
        return HSplitter;
    }(controls.Element));
    controls.HSplitter = HSplitter;
    var VSplitter = (function (_super) {
        __extends(VSplitter, _super);
        function VSplitter(element, initialSplitPercentage) {
            var _this = this;
            if (initialSplitPercentage === void 0) { initialSplitPercentage = 50; }
            _super.call(this, element);
            this.splitterWidth = 6;
            this.css({
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "bottom": "0px",
                "right": "0px"
            });
            this.splitPosition = this.getHeight() * initialSplitPercentage / 100;
            this.topPane = new controls.Element(this.$element.children(":nth-child(1)"));
            this.topPane.css({
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "height": this.splitPosition,
                "right": "0px"
            });
            $("<div class='splitter-handle vertical'>").insertAfter(this.topPane.$element);
            // Need to set the width of the splitter before creating the DraggableElement
            var $splitter = this.$element.children(":nth-child(2)");
            $splitter.css({
                "position": "absolute",
                "top": this.splitPosition,
                "left": "0px",
                "height": "" + this.splitterWidth + "px",
                "right": "0px",
                "-webkit-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "user-select": "none"
            });
            this.splitter = new DraggableElement($splitter, controls.Direction.Vertical, 0, this.getHeight());
            this.splitter.onDrag(function (evt) { return _this.splitter_onDrag(evt); });
            this.bottomPane = new controls.Element(this.$element.children(":nth-child(3)"));
            this.bottomPane.css({
                "position": "absolute",
                "top": this.splitPosition + this.splitterWidth,
                "left": "0px",
                "bottom": "0px",
                "right": "0px"
            });
        }
        VSplitter.prototype.splitter_onDrag = function (evt) {
            this.splitPosition = evt.position;
            this.topPane.css({ "height": this.splitPosition });
            this.bottomPane.css({ "top": this.splitPosition + this.splitterWidth });
        };
        return VSplitter;
    }(controls.Element));
    controls.VSplitter = VSplitter;
})(controls || (controls = {}));
