import { EleventyRenderPlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
        // Add a filter to get unique items
	eleventyConfig.addFilter("unique", (array) => {
          return Array.from(new Set(array));
	});

        // Add a filter to slugify collection names
        eleventyConfig.addFilter("slug", (input) => {
          return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
	});

	eleventyConfig.addFilter("removeItem", function(array, itemToRemove) {
	  return array.filter(item => item !== itemToRemove);
        });

  eleventyConfig.addFilter('keepContainingString', function(array, string) {
    return array.filter(item => item.includes(string));
  });

  eleventyConfig.addFilter('getRoot', (collection) => {
    let array = collection.split('/');
    return array.slice(0, array.length - 1).join('/');
  });

  eleventyConfig.addFilter('getAuthors', (authorArray) => {
    const getAuthors = (authorArray_) => {
      return authorArray_.map((authorEntry) => {
        if (authorEntry.literal) {
          return authorEntry.literal;
        }
        return authorEntry.family + ', ' + authorEntry.given;
      }).join(' and ')
    };
    let authorsString = getAuthors(authorArray);
    if (authorsString.length <= 70) {
      return authorsString;
    } else {
      return getAuthors([authorArray[0]]) + " et al.";
    }
  });
	eleventyConfig.addPassthroughCopy("img");
	eleventyConfig.addPassthroughCopy("css");
	eleventyConfig.addPassthroughCopy("fonts");
	eleventyConfig.addPassthroughCopy("js");

	eleventyConfig.addPlugin(EleventyRenderPlugin);

	return {
	       dir: {
	       	    input: ".",
		    includes: "_includes",
		    data: "_data",
		    output: "_site"
		    }
	};
};
