module controls
{
    class DropTarget
    {
        public element: HTMLElement;
        public dragManager: DragManager;
    }

    export interface DragDropEvent
    {
        sourceElement: HTMLElement; // element user dragged 
        mouseDownX: number; // X coordinate of initial mouse down event that started the drag
        mouseDownY: number; // Y coordinate of initial mouse down event that started the drag
        mouseX: number; // current X coordinate of mouse
        mouseY: number; // current Y coordinate of mouse
        offsetX: number; // X offset of mousedown location within the dragged element bounds
        offsetY: number; // Y offset of mousedown location within the dragged element bounds
        data?: any; // data to be sent to drop target
        visualDragElement?: HTMLElement; // HTMLElement displayed under the cursor as user drags
    }


    export class DragManager
    {
        // The current drag event state
        private dragging: boolean = false;
        private currentDragEvent: DragDropEvent = null;
        private overTarget: DropTarget; // Drop target we are currently hovering over

        // List of registered drop targets - shared amongst all instaces of DragManager
        private static dropTargets: DropTarget[] = [];

        private dragStartHandler: (evt: DragDropEvent) => void = null
        private trackDragHandler: (evt: DragDropEvent, overTarget: boolean) => void = null;
        private dropHandler: (evt: DragDropEvent) => void = null;

        constructor()
        {
            $(document).on("mousemove",(evt) => this.onDocumenttMouseMove(evt));
            $(document).on("mouseup",(evt) => this.onDocumentMouseUp(evt));
        }

        public onDragStart(dragStartHandler: (evt: DragDropEvent) => void)
        {
            this.dragStartHandler = dragStartHandler;
        }

        public onTrackDrag(trackDragHandler: (evt: DragDropEvent, overTarget: boolean) => void)
        {
            this.trackDragHandler = trackDragHandler;
        }

        public onDrop(dropHandler: (evt: DragDropEvent) => void)
        {
            this.dropHandler = dropHandler;
        }

        public registerDropTarget(dropTarget: HTMLElement)
        {
            DragManager.dropTargets.push({ element: dropTarget, dragManager: this });
        }

        public $registerDragSource(jQuery: JQuery)
        {
            this.registerDragSource(jQuery.get(0));
        }

        public registerDragSource(element: HTMLElement)
        {
            // don't hold reference to element, as could cause leaks if it is removed from DOM - just attach events
            $(element).on("mousedown",(evt) => this.onElementMouseDown(evt));
            element.style.cursor = "default";
        }

        private onElementMouseDown(evt: JQueryMouseEventObject): any
        {
            this.currentDragEvent = {
                sourceElement: <HTMLElement>evt.target,
                mouseDownX: evt.clientX,
                mouseDownY: evt.clientY,
                mouseX: evt.clientX,
                mouseY: evt.clientY,
                offsetX: evt.offsetX,
                offsetY: evt.offsetY
            };
        }

        private onDocumenttMouseMove(evt: JQueryMouseEventObject): any
        {
            var mouseOverElement = <HTMLElement>evt.target;

            if (this.currentDragEvent != null)
            {
                this.currentDragEvent.mouseX = evt.clientX;
                this.currentDragEvent.mouseY = evt.clientY;
            }

            if (this.dragging)
            {              
                // drag drag feedback
                this.currentDragEvent.visualDragElement.style.left = (evt.clientX - this.currentDragEvent.offsetX) + "px";
                this.currentDragEvent.visualDragElement.style.top = (evt.clientY - this.currentDragEvent.offsetY) + "px";

                var dropTarget = this.findDropTarget(evt);
                if (dropTarget)
                {
                    // Are we over a different target? If so notify the previous one that we've left
                    if (this.overTarget && this.overTarget.element !== dropTarget.element)
                    {
                        this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                        this.overTarget = null;
                    }
                    dropTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, true);
                    this.overTarget = dropTarget;
                }
                else if (this.overTarget)
                {
                    this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                    this.overTarget = null;
                }

                evt.preventDefault();
                return false;
            }
            else if ((this.currentDragEvent != null) && (mouseOverElement === this.currentDragEvent.sourceElement))
            {
                // only start the drag if the mouse has moved away from the initial mousedown location
                if ((this.currentDragEvent.mouseDownX != evt.clientX) || (this.currentDragEvent.mouseDownY != evt.clientY))
                {
                    this.dragging = true;
                    if (this.dragStartHandler)
                    {
                        this.dragStartHandler(this.currentDragEvent);
                    }
                    if (!this.currentDragEvent.visualDragElement)
                    {
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
            else 
            {
                return true;
            }
        }

        private onDocumentMouseUp(evt: JQueryMouseEventObject): any
        {
            if (this.overTarget)
            {
                this.overTarget.dragManager.dispatchTrackDragEvent(this.currentDragEvent, false);
                this.overTarget = null;
            }

            if (this.dragging)
            {
                var dropTarget = this.findDropTarget(evt);
                if (dropTarget != null)
                {
                    dropTarget.dragManager.dispatchDropEvent(this.currentDragEvent);
                }
                document.body.removeChild(this.currentDragEvent.visualDragElement);
                this.currentDragEvent = null;
                this.dragging = false;
                evt.preventDefault();
                return false;
            }
            else
            {
                this.currentDragEvent = null;
                return true;
            }
        }

        private dispatchTrackDragEvent(dragEvent: DragDropEvent, overTarget: boolean)
        {
            if (this.trackDragHandler)
            {
                this.trackDragHandler(dragEvent, overTarget);
            }
        }

        private dispatchDropEvent(dragEvent: DragDropEvent)
        {
            if (this.dropHandler)
            {
                this.dropHandler(dragEvent);
            }
        }

        private findDropTarget(evt: JQueryMouseEventObject): DropTarget
        {
            for (var i = 0; i < DragManager.dropTargets.length; i++)
            {
                var target = DragManager.dropTargets[i];
                var targetRect = target.element.getBoundingClientRect();
                if ((evt.clientX >= targetRect.left) && (evt.clientX <= targetRect.right) && (evt.clientY >= targetRect.top) && (evt.clientY <= targetRect.bottom))                  
                {
                    return target;
                }
            }
            return null;
        }

    }

    export enum Direction
    {
        Horizontal = 1,
        Vertical = 2
    }

    export interface DragElementEvent
    {
        element: HTMLElement;
        position: number;
    }

    export class DraggableElement extends Element
    {
        private element: HTMLElement;
        private gotMouseDown: boolean = false;
        private dragging: boolean = false;
        private disabled: boolean = false;
        private ignoreClick: boolean = false;
        private savedZIndex: String;

        private direction: Direction;
        private minPosition: number;
        private maxPosition: number;

        // Where the mousedown event happened
        private startMouseX: number;
        private startMouseY: number;
        // Initial location of the element
        private startElementLeft: number;
        private startElementTop: number;

        // We need to store references to the closures so we can unregister them
        private mouseMoveHandler: (evt: JQueryMouseEventObject) => boolean;
        private mouseUpHandler: (evt: JQueryMouseEventObject) => boolean;

        private dragHandler: (evt: DragElementEvent) => void = null;
        private dropHandler: (evt: DragElementEvent) => void = null;
        private clickHandler: (evt: any) => void = null;
        
        constructor(element: any, direction: Direction, minPosition: number, maxPosition: number)
        {
            super(element);

            this.element = this.$element.get(0);
            this.direction = direction;
            this.setLimits(minPosition, maxPosition);

            this.$element.on("mousedown",(evt) => this.handleMouseDown(evt));
            this.mouseMoveHandler = (evt) => this.handleMouseMove(evt);
            this.mouseUpHandler = (evt) => this.handleMouseUp(evt);

            this.$element.click((evt) =>
            {
                Console.debug("DraggableElement.click. ignoreClick:" + this.ignoreClick);
                
                if (!this.ignoreClick)
                {
                    if(this.clickHandler) this.clickHandler(evt);
                }
                else
                {
                    this.ignoreClick = false;
                    evt.stopPropagation();
                }
            });
        }

        // Override Element.onClick
        public onClick(clickHandler: (evt: any) => void)
        {
            this.clickHandler = clickHandler;
        }

        public onDrag(dragHandler: (evt: DragElementEvent) => void)
        {
            this.dragHandler = dragHandler;
        }

        public onDrop(dropHandler: (evt: DragElementEvent) => void)
        {
            this.dropHandler = dropHandler;
        }

        public isDragging(): boolean
        {
            return this.dragging;
        }

        public setLimits(minPosition: number, maxPosition: number)
        {
            this.minPosition = minPosition;
            this.maxPosition = maxPosition - ((this.direction == Direction.Horizontal) ? this.getWidth() : this.getHeight());

            Console.debug("drag limits minPosition:" + this.minPosition + ",maxPosition:" + this.maxPosition + ",width:" + this.getWidth());
            if (this.direction == Direction.Horizontal)
            {
                this.element.style.left = Math.min(this.maxPosition, Math.max(this.minPosition, this.$element.position().left)) + "px";
            }
            else
            {
                this.element.style.top = Math.min(this.maxPosition, Math.max(this.minPosition, this.$element.position().top)) + "px";
            }
        }
        public getLimits()
        {
            return { "min": this.minPosition, "max": this.maxPosition };
        }

        public setDisabled(disabled: boolean)
        {
            this.disabled = disabled;
            if (disabled)
            {
                this.$element.addClass("disabled");
            }
            else
            {
                this.$element.removeClass("disabled");
            }
        }

        private handleMouseDown(evt: JQueryMouseEventObject): boolean
        {
            if (!this.disabled)
            {
                if ((<any>this.element).setCapture)
                {
                    // Firefox, IE
                    (<any>this.element).setCapture(false);
                    this.$element.on("mousemove", this.mouseMoveHandler);
                    this.$element.on("mouseup", this.mouseUpHandler);
                }
                else
                {
                    // Chrome doesn't support setCapture() so need to capture all mouse events
                    $(document).on("mousemove", this.mouseMoveHandler);
                    $(document).on("mouseup", this.mouseUpHandler);
                }

                this.startMouseX = evt.clientX;
                this.startMouseY = evt.clientY;
                this.startElementLeft = this.$element.position().left;
                this.startElementTop = this.$element.position().top;

                Console.debug("mousedown clientX:" + evt.clientX + ",offsetX:" + evt.offsetX + ",elementX:" + this.startElementLeft + ",styleLeft:" + this.$element.css("left"));
                this.gotMouseDown = true;
                this.savedZIndex = this.$element.css("z-index");
                this.$element.css({ "z-index": 1000 });
            }
            evt.preventDefault();
            evt.cancelBubble = true;
            return false;
        }

        private handleMouseMove(evt: JQueryMouseEventObject): boolean
        {
            if (!this.dragging && this.gotMouseDown && (evt.clientX != this.startMouseX || evt.clientY != this.startMouseY))
            {
                // mouse has moved since mouse down - start drag
                this.dragging = true;
            }

            if (this.dragging && !this.disabled)
            {
                var position;
                if (this.direction == Direction.Horizontal)
                {
                    var deltaX = evt.clientX - this.startMouseX;
                    position = Math.min(this.maxPosition, Math.max(this.minPosition, this.startElementLeft + deltaX));
                    //                    Console.debug("mousemove clientX:" + evt.clientX + ",deltaX:" + deltaX + ",this.maxPosition:" + this.maxPosition + ",this.minPosition:" + this.minPosition + ", position:" + position);
                    this.element.style.left = position + "px";
                }
                else
                {
                    var deltaY = evt.clientY - this.startMouseY;
                    position = Math.min(this.maxPosition, Math.max(this.minPosition, this.startElementTop + deltaY));
                    this.element.style.top = position + "px";
                }
                if (this.dragHandler)
                {
                    this.dragHandler({ element: this.element, position: position });
                }
                evt.preventDefault();
                evt.cancelBubble = true;
                this.ignoreClick = true;
                return false;
            }
            else
            {
                return true;
            }
        }

        private handleMouseUp(evt: JQueryMouseEventObject): boolean
        {
            this.gotMouseDown = false;

            if (this.dragging && !this.disabled)
            {
                this.dragging = false;
                this.css({ "z-index": this.savedZIndex });

                if ((<any>this.element).setCapture)
                {
                    // Firefox, IE
                    (<any>this.element).releaseCapture();
                    this.$element.off("mousemove", this.mouseMoveHandler);
                    this.$element.off("mouseup", this.mouseUpHandler);
                }
                else
                {
                    // Chrome doesn't support setCapture()
                    $(document).off("mousemove", this.mouseMoveHandler);
                    $(document).off("mouseup", this.mouseUpHandler);
                }

                if (this.dropHandler)
                {
                    this.dropHandler({ element: this.element, position: parseInt(this.element.style.left) });
                }

                evt.cancelBubble = true;
                evt.preventDefault();
                return false;
            }
            else
            {
                return true;
            }
        }
    }

    export class HSplitter extends Element
    {
        private leftPane: Element;
        private splitter: DraggableElement;
        private rightPane: Element;

        private splitPosition: number;
        private splitterWidth = 6;

        constructor(element: any, initialSplitPercentage: number = 50)
        {
            super(element);

            this.css({
                "position": "absolute",
                "left": "0px",
                "right": "0px",
                "bottom": "0px",
                "top": "0px"
            });

            this.splitPosition = this.getWidth() * initialSplitPercentage / 100;

            this.leftPane = new Element(this.$element.children(":nth-child(1)"));
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
                "-webkit-user-select": "none", /* Chrome/Safari */
                "-moz-user-select": "none", /* Firefox */
                "-ms-user-select": "none", /* IE10+ */
                "user-select": "none"
            });
            this.splitter = new DraggableElement($splitter, Direction.Horizontal, 0, this.getWidth());
            this.splitter.onDrag((evt) => this.splitter_onDrag(evt));

            this.rightPane = new Element(this.$element.children(":nth-child(3)"));
            this.rightPane.css({
                "position": "absolute",
                "top": "0px",
                "left": this.splitPosition + this.splitterWidth,
                "bottom": "0px",
                "right": "0px"
            });
        }

        private splitter_onDrag(evt: DragElementEvent)
        {
            this.splitPosition = evt.position;
            this.leftPane.css({ "width": this.splitPosition });
            this.rightPane.css({ "left": this.splitPosition + this.splitterWidth });
        }
    }


    export class VSplitter extends Element
    {
        private topPane: Element;
        private splitter: DraggableElement;
        private bottomPane: Element;

        private splitPosition: number;
        private splitterWidth = 6;

        constructor(element: any, initialSplitPercentage: number = 50)
        {
            super(element);

            this.css({
                "position": "absolute",
                "top": "0px",
                "left": "0px",
                "bottom": "0px",
                "right": "0px"
            });

            this.splitPosition = this.getHeight() * initialSplitPercentage / 100;

            this.topPane = new Element(this.$element.children(":nth-child(1)"));
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
                "-webkit-user-select": "none", /* Chrome/Safari */
                "-moz-user-select": "none", /* Firefox */
                "-ms-user-select": "none", /* IE10+ */
                "user-select": "none"
            });
            this.splitter = new DraggableElement($splitter, controls.Direction.Vertical, 0, this.getHeight());
            this.splitter.onDrag((evt) => this.splitter_onDrag(evt));

            this.bottomPane = new Element(this.$element.children(":nth-child(3)"));
            this.bottomPane.css({
                "position": "absolute",
                "top": this.splitPosition + this.splitterWidth,
                "left": "0px",
                "bottom": "0px",
                "right": "0px"
            });
        }

        private splitter_onDrag(evt: DragElementEvent)
        {
            this.splitPosition = evt.position;
            this.topPane.css({ "height": this.splitPosition });
            this.bottomPane.css({ "top": this.splitPosition + this.splitterWidth });
        }
    }
}