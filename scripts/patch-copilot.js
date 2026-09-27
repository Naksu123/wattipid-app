const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'node_modules', 'react-native-copilot', 'dist');
const jsFile = path.join(targetDir, 'index.js');
const mjsFile = path.join(targetDir, 'index.mjs');

function patchFile(filePath, isMjs) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-copilot] Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Patch ViewMask if not already patched
  if (!content.includes('key: "top_overlay"')) {
    if (isMjs) {
      const oldViewMaskPattern = /ViewMask = \(props\) => \{[\s\S]*?return \/\* @__PURE__ \*\/ React4\.createElement\([\s\S]*?styles\.overlayRectangle, item\] \}\);\s*\}\)\s*\);\s*\};\s*\}\s*\}\);/;
      const newViewMaskMjs = `ViewMask = (props) => {
      const posX = props.position ? Math.max(0, props.position.x || 0) : 0;
      const posY = props.position ? Math.max(0, props.position.y || 0) : 0;
      const sizeX = props.size ? Math.max(0, props.size.x || 0) : 0;
      const sizeY = props.size ? Math.max(0, props.size.y || 0) : 0;

      const topHeight = posY;
      const bottomTop = posY + sizeY;
      const leftWidth = posX;
      const rightLeft = posX + sizeX;
      const bg = props.backdropColor || "rgba(0, 0, 0, 0.4)";

      return /* @__PURE__ */ React4.createElement(
        View4,
        {
          style: [props.style, { backgroundColor: "transparent" }],
          onStartShouldSetResponder: () => true,
          onResponderRelease: props.onClick
        },
        [
          /* Full-screen blocker captures any tap anywhere on screen */
          /* @__PURE__ */ React4.createElement(View4, {
            key: "full_overlay_touch_blocker",
            style: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "transparent" },
            pointerEvents: "auto"
          }),
          /* Top rectangle */
          /* @__PURE__ */ React4.createElement(View4, {
            key: "top_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: 0, left: 0, right: 0, height: topHeight, backgroundColor: bg }]
          }),
          /* Bottom rectangle */
          /* @__PURE__ */ React4.createElement(View4, {
            key: "bottom_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: bottomTop, left: 0, right: 0, bottom: 0, backgroundColor: bg }]
          }),
          /* Left rectangle */
          /* @__PURE__ */ React4.createElement(View4, {
            key: "left_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: topHeight, left: 0, width: leftWidth, height: sizeY, backgroundColor: bg }]
          }),
          /* Right rectangle */
          /* @__PURE__ */ React4.createElement(View4, {
            key: "right_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: topHeight, left: rightLeft, right: 0, height: sizeY, backgroundColor: bg }]
          })
        ]
      );
    };
  }
});`;
      if (oldViewMaskPattern.test(content)) {
        content = content.replace(oldViewMaskPattern, newViewMaskMjs);
        modified = true;
        console.log(`[patch-copilot] Patched ViewMask in ${path.basename(filePath)}`);
      }
    } else {
      const oldViewMaskPattern = /ViewMask = \(props\) => \{[\s\S]*?return \/\* @__PURE__ \*\/ import_react4\.default\.createElement\([\s\S]*?styles\.overlayRectangle, item\] \}\);\s*\}\)\s*\);\s*\};\s*\}\s*\}\);/;
      const newViewMaskJs = `ViewMask = (props) => {
      const posX = props.position ? Math.max(0, props.position.x || 0) : 0;
      const posY = props.position ? Math.max(0, props.position.y || 0) : 0;
      const sizeX = props.size ? Math.max(0, props.size.x || 0) : 0;
      const sizeY = props.size ? Math.max(0, props.size.y || 0) : 0;

      const topHeight = posY;
      const bottomTop = posY + sizeY;
      const leftWidth = posX;
      const rightLeft = posX + sizeX;
      const bg = props.backdropColor || "rgba(0, 0, 0, 0.4)";

      return /* @__PURE__ */ import_react4.default.createElement(
        import_react_native5.View,
        {
          style: [props.style, { backgroundColor: "transparent" }],
          onStartShouldSetResponder: () => true,
          onResponderRelease: props.onClick
        },
        [
          /* Full-screen blocker captures any tap anywhere on screen */
          /* @__PURE__ */ import_react4.default.createElement(import_react_native5.View, {
            key: "full_overlay_touch_blocker",
            style: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "transparent" },
            pointerEvents: "auto"
          }),
          /* Top rectangle */
          /* @__PURE__ */ import_react4.default.createElement(import_react_native5.View, {
            key: "top_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: 0, left: 0, right: 0, height: topHeight, backgroundColor: bg }]
          }),
          /* Bottom rectangle */
          /* @__PURE__ */ import_react4.default.createElement(import_react_native5.View, {
            key: "bottom_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: bottomTop, left: 0, right: 0, bottom: 0, backgroundColor: bg }]
          }),
          /* Left rectangle */
          /* @__PURE__ */ import_react4.default.createElement(import_react_native5.View, {
            key: "left_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: topHeight, left: 0, width: leftWidth, height: sizeY, backgroundColor: bg }]
          }),
          /* Right rectangle */
          /* @__PURE__ */ import_react4.default.createElement(import_react_native5.View, {
            key: "right_overlay",
            style: [styles.overlayRectangle, { position: "absolute", top: topHeight, left: rightLeft, right: 0, height: sizeY, backgroundColor: bg }]
          })
        ]
      );
    };
  }
});`;
      if (oldViewMaskPattern.test(content)) {
        content = content.replace(oldViewMaskPattern, newViewMaskJs);
        modified = true;
        console.log(`[patch-copilot] Patched ViewMask in ${path.basename(filePath)}`);
      }
    }
  }

  // 2. Patch StepNumber guard
  if (!content.includes('typeof StepNumberComponent === "function"')) {
    if (isMjs) {
      content = content.replace(
        /\/\* @__PURE__ \*\/ React5\.createElement\(\s*Animated3\.View,\s*\{\s*key:\s*"stepNumber"[\s\S]*?StepNumberComponent,\s*null\)\s*\)/,
        `(StepNumberComponent && typeof StepNumberComponent === "function" && StepNumberComponent() !== null) ? /* @__PURE__ */ React5.createElement(Animated3.View, { key: "stepNumber", style: [styles.stepNumberContainer, { left: animatedValues.stepNumberLeft, top: Animated3.add(animatedValues.top, -STEP_NUMBER_RADIUS) }] }, /* @__PURE__ */ React5.createElement(StepNumberComponent, null)) : null`
      );
      modified = true;
    } else {
      content = content.replace(
        /\/\* @__PURE__ \*\/ import_react5\.default\.createElement\(\s*import_react_native6\.Animated\.View,\s*\{\s*key:\s*"stepNumber"[\s\S]*?StepNumberComponent,\s*null\)\s*\)/,
        `(StepNumberComponent && typeof StepNumberComponent === "function" && StepNumberComponent() !== null) ? /* @__PURE__ */ import_react5.default.createElement(import_react_native6.Animated.View, { key: "stepNumber", style: [styles.stepNumberContainer, { left: animatedValues.stepNumberLeft, top: import_react_native6.Animated.add(animatedValues.top, -STEP_NUMBER_RADIUS) }] }, /* @__PURE__ */ import_react5.default.createElement(StepNumberComponent, null)) : null`
      );
      modified = true;
    }
  }

  // 3. Patch measureLayout in setCurrentStep (Replaces non-native relative ref measureLayout with direct native window measurement)
  if (content.includes('measureLayout(')) {
    const measureLayoutPattern = /let didScroll = false;\s*if \(scrollView != null\) \{[\s\S]*?\/\/ ignore\s*\}\s*\}/;

    const newScrollMeasureJs = `let didScroll = false;
      if (scrollView != null) {
        try {
          const dims = (import_react_native7.Dimensions && import_react_native7.Dimensions.get) ? import_react_native7.Dimensions.get("window") : { width: 360, height: 800 };
          const winHeight = dims.height || 800;
          const initialSize = yield step.measure();
          if (initialSize && typeof initialSize.y === "number" && !isNaN(initialSize.y)) {
            const targetY = initialSize.y;
            const targetHeight = initialSize.height || 80;
            const currentScrollY = Number(scrollView._scrollY || 0);

            const isOffTop = targetY < 120;
            const isOffBottom = (targetY + Math.min(targetHeight, 180)) > (winHeight - 200);

            if (isOffTop || isOffBottom) {
              const scrollDelta = targetY - 150;
              const desiredScrollY = Math.max(0, currentScrollY + scrollDelta);
              if (typeof scrollView.scrollTo === "function") {
                scrollView.scrollTo({ y: desiredScrollY, animated: true });
                scrollView._scrollY = desiredScrollY;
                didScroll = true;
              }
            }
          }
        } catch (_e) {
          // ignore
        }
      }`;

    const newScrollMeasureMjs = `let didScroll = false;
      if (scrollView != null) {
        try {
          const dims = (Dimensions && Dimensions.get) ? Dimensions.get("window") : { width: 360, height: 800 };
          const winHeight = dims.height || 800;
          const initialSize = yield step.measure();
          if (initialSize && typeof initialSize.y === "number" && !isNaN(initialSize.y)) {
            const targetY = initialSize.y;
            const targetHeight = initialSize.height || 80;
            const currentScrollY = Number(scrollView._scrollY || 0);

            const isOffTop = targetY < 120;
            const isOffBottom = (targetY + Math.min(targetHeight, 180)) > (winHeight - 200);

            if (isOffTop || isOffBottom) {
              const scrollDelta = targetY - 150;
              const desiredScrollY = Math.max(0, currentScrollY + scrollDelta);
              if (typeof scrollView.scrollTo === "function") {
                scrollView.scrollTo({ y: desiredScrollY, animated: true });
                scrollView._scrollY = desiredScrollY;
                didScroll = true;
              }
            }
          }
        } catch (_e) {
          // ignore
        }
      }`;

    if (measureLayoutPattern.test(content)) {
      content = content.replace(measureLayoutPattern, isMjs ? newScrollMeasureMjs : newScrollMeasureJs);
      modified = true;
      console.log(`[patch-copilot] Successfully replaced measureLayout with safe window measurement in ${path.basename(filePath)}`);
    }
  }

  // 4. Enhance CopilotStep measure with measureInWindow
  if (!content.includes('measureInWindow(')) {
    const oldMeasurePattern = /const measure2 = \(\) => \{\s*if \(wrapperRef\.current != null && typeof wrapperRef\.current\.measure === "function"\) \{[\s\S]*?wrapperRef\.current\.measure\(\(_ox, _oy, width, height, x, y\) => \{[\s\S]*?\}\);[\s\S]*?\} catch \(_e\) \{[\s\S]*?resolve\(\{ x: 0, y: 0, width: 0, height: 0 \}\);[\s\S]*?\}[\s\S]*?\} else \{/;
    
    const newMeasureCode = `const measure2 = () => {
        if (wrapperRef.current != null) {
          try {
            if (typeof wrapperRef.current.measureInWindow === "function") {
              wrapperRef.current.measureInWindow((x, y, width, height) => {
                resolve({
                  x: isNaN(x) ? 0 : x,
                  y: isNaN(y) ? 0 : y,
                  width: isNaN(width) ? 0 : width,
                  height: isNaN(height) ? 0 : height
                });
              });
              return;
            } else if (typeof wrapperRef.current.measure === "function") {
              wrapperRef.current.measure((_ox, _oy, width, height, x, y) => {
                resolve({
                  x: isNaN(x) ? 0 : x,
                  y: isNaN(y) ? 0 : y,
                  width: isNaN(width) ? 0 : width,
                  height: isNaN(height) ? 0 : height
                });
              });
              return;
            }
          } catch (_e) {
            resolve({ x: 0, y: 0, width: 0, height: 0 });
            return;
          }
        }
        if (true) {`;

    if (oldMeasurePattern.test(content)) {
      content = content.replace(oldMeasurePattern, newMeasureCode);
      modified = true;
      console.log(`[patch-copilot] Successfully enhanced CopilotStep measure with measureInWindow in ${path.basename(filePath)}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-copilot] Updated ${path.basename(filePath)}`);
  } else {
    console.log(`[patch-copilot] ${path.basename(filePath)} already up-to-date.`);
  }
}

patchFile(jsFile, false);
patchFile(mjsFile, true);
console.log('[patch-copilot] Finished.');
