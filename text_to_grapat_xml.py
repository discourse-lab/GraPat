#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Created on 23.07.2014

@author: Andreas Peldszus
'''

import argparse
import codecs
from lxml import etree
import os


def generate_xml(text_id, segments):
    doc_elm = etree.XML(
        '<annotation_bundle id="ab-%s" semantics="argumentation" />' % text_id)
    entity_elm = etree.XML('<entity id="%s" />' % text_id)

    for segment_id, segment in enumerate(segments):
        segment_elm = etree.XML('<token_range id="%d" />' % segment_id)
        segment_elm.text = etree.CDATA(segment)
        entity_elm.append(segment_elm)

    doc_elm.append(entity_elm)

    xmlstring = etree.tostring(
        doc_elm, encoding='UTF-8', pretty_print=True, xml_declaration=True)
    return xmlstring


def convert(path_to_file):
    # read input
    print "Reading from", path_to_file
    lines = codecs.open(path_to_file, 'r', 'utf-8').readlines()
    # filter out comments and empty lines
    segments = [line.strip() for line in lines
                if line.strip() != '' and not line.startswith('#')]
    text_id = os.path.basename(path_to_file)[:-4]
    # generate xml
    xmlstring = generate_xml(text_id, segments)
    # save xml
    outpath = os.path.join(os.path.dirname(path_to_file), text_id + '.xml')
    print "Writing to", outpath
    with open(outpath, 'w') as outxml:
        outxml.write(xmlstring)


def main():
    aparser = argparse.ArgumentParser(description="""
        Converts a input .txt file with one EDU per line into
        the GraPAT annotation bundle xml format.
    """)
    aparser.add_argument(
        "input", help="the text file to be converted", nargs='+')
    args = aparser.parse_args()

    for filename in args.input:
        path = os.path.abspath(filename)
        if (os.path.isfile(path) and os.access(path, os.R_OK)):
            convert(path)
        else:
            print "Cannot read input file", path

if __name__ == '__main__':
    main()
