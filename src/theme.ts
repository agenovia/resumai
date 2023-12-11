// theme.js

// 1. import `extendTheme` function
import { extendTheme } from "@chakra-ui/react";

// 2. Add your color mode config
const config = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

const fonts = {
  fonts: {
    heading: `'Merriweather', sans-serif`,
    body: `'Lato', sans-serif`,
  },
};

// 3. extend the theme
const theme = extendTheme({ ...config, ...fonts });

export default theme;
