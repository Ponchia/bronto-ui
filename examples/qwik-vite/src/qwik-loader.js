import { QWIK_LOADER } from '@builder.io/qwik/loader';

const script = document.createElement('script');
script.textContent = QWIK_LOADER;
document.head.append(script);
