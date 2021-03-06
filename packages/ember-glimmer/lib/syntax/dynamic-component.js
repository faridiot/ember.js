import { ArgsSyntax, StatementSyntax } from 'glimmer-runtime';
import { ConstReference, isConst, UNDEFINED_REFERENCE } from 'glimmer-reference';
import { assert } from 'ember-metal/debug';

function dynamicComponentFor(vm) {
  let env     = vm.env;
  let args    = vm.getArgs();
  let nameRef = args.positional.at(0);
  let { parentMeta } = this;

  if (isConst(nameRef)) {
    let name = nameRef.value();
    let definition = env.getComponentDefinition([name], parentMeta);

    assert(`Could not find component named "${name}" (no component or template with that name was found)`, definition);

    return new ConstReference(definition);
  } else {
    return new DynamicComponentReference({ nameRef, env, parentMeta });
  }
}

export class DynamicComponentSyntax extends StatementSyntax {
  constructor({ args, templates, parentMeta }) {
    super();
    this.definitionArgs = ArgsSyntax.fromPositionalArgs(args.positional.slice(0, 1));
    this.definition = dynamicComponentFor.bind(this);
    this.args = ArgsSyntax.build(args.positional.slice(1), args.named);
    this.templates = templates;
    this.shadow = null;
    this.parentMeta = parentMeta;
  }

  compile(builder) {
    builder.component.dynamic(this);
  }
}

class DynamicComponentReference {
  constructor({ nameRef, env, parentMeta }) {
    this.nameRef = nameRef;
    this.env = env;
    this.tag = nameRef.tag;
    this.parentMeta = parentMeta;
  }

  value() {
    let { env, nameRef, parentMeta } = this;
    let name = nameRef.value();

    if (typeof name === 'string') {
      let definition = env.getComponentDefinition([name], parentMeta);

      assert(`Could not find component named "${name}" (no component or template with that name was found)`, definition);

      return definition;
    } else {
      return null;
    }
  }

  get() {
    return UNDEFINED_REFERENCE;
  }
}
