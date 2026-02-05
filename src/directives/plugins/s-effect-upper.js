// s-effect-upper plugin
// all effect directives should start with 's-effect"
export default function upperCaseEffectPlugin(S) {
  S.directive("s-effect-upper", ({ el }) => {
    el.textContent = el.textContent.toUpperCase();
  });
}
